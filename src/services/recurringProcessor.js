import { recurringDB } from './recurringDB';
import { transactionDB } from './db';
import { format } from 'date-fns';

class RecurringProcessor {
  constructor() {
    this.isProcessing = false;
    this.checkInterval = null;
  }

  // Start automatic processing
  start() {
    if (this.checkInterval) return;
    
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.processRecurringTransactions();
    }, 60000); // 60 seconds

    // Run immediately on start
    this.processRecurringTransactions();
    
    console.log('Recurring transaction processor started');
  }

  // Stop automatic processing
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Recurring transaction processor stopped');
    }
  }

  // Process all due recurring transactions
  async processRecurringTransactions() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const activeRecurring = await recurringDB.getActive();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      for (const recurring of activeRecurring) {
        // Check if transaction is due
        if (recurring.nextDate <= today) {
          await this.executeRecurring(recurring);
        }
      }
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Execute a single recurring transaction
  async executeRecurring(recurring) {
    try {
      // Create the transaction
      const transaction = await transactionDB.create({
        accountId: recurring.accountId,
        type: recurring.type,
        amount: recurring.amount,
        description: `${recurring.description} (Auto)`,
        category: recurring.category,
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: true,
        recurringId: recurring.id,
      });

      // Mark as executed and calculate next date
      await recurringDB.markExecuted(recurring.id, transaction.id);

      console.log(`Executed recurring transaction: ${recurring.description}`);
      
      // Trigger custom event for UI updates
      window.dispatchEvent(new CustomEvent('recurring-executed', {
        detail: { recurring, transaction }
      }));

      return transaction;
    } catch (error) {
      console.error(`Error executing recurring transaction ${recurring.id}:`, error);
      throw error;
    }
  }

  // Check if recurring transactions need processing (for UI trigger)
  async checkDueTransactions() {
    const activeRecurring = await recurringDB.getActive();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    return activeRecurring.filter(r => r.nextDate <= today);
  }

  // Manually trigger processing
  async triggerProcessing() {
    await this.processRecurringTransactions();
  }
}

// Export singleton instance
export const recurringProcessor = new RecurringProcessor();

// Auto-start on module load
if (typeof window !== 'undefined') {
  recurringProcessor.start();
  
  // Stop on page unload
  window.addEventListener('beforeunload', () => {
    recurringProcessor.stop();
  });
}

export default RecurringProcessor;
