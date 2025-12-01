# Testing Guide: Recurring Transactions Feature

## Overview
The recurring transactions feature allows automatic processing of scheduled income and expenses. This guide will help you test all aspects of the feature.

## Prerequisites
- Dev server running (`npm run dev`)
- At least one account created
- Browser with developer console open to see logs

## Test Scenarios

### 1. Create a Recurring Transaction (Daily)

**Steps:**
1. Navigate to Settings → Recurring Transactions
2. Click "Add New" or the + button
3. Fill in the form:
   - Type: Expense
   - Account: Select any account
   - Amount: $5.00
   - Description: "Daily coffee"
   - Category: Food & Dining
   - Frequency: Daily
   - Start Date: Today's date
4. Click "Create Recurring Transaction"

**Expected Results:**
- Success alert appears
- Redirected to Recurring Transactions list
- New recurring transaction shows with "Next: [today's date]"
- Status shows "Active" with blue badge

### 2. Test Automatic Processing

**Important:** For testing purposes, you may want to temporarily modify the check interval in `src/services/recurringProcessor.js`:

```javascript
// Change line 8 from:
this.checkInterval = 60000; // Check every 60 seconds

// To (for faster testing):
this.checkInterval = 10000; // Check every 10 seconds
```

**Steps:**
1. Create a recurring transaction with start date = today's date
2. Wait for the automatic processor to run (60 seconds by default, 10 seconds if modified)
3. Watch for toast notification

**Expected Results:**
- After the interval, a toast notification appears at the top
- The notification shows: "💸 Daily coffee: $5.00"
- Check Transactions page - new transaction should appear
- Check account balance - should be updated
- Check Recurring Transactions page - "Next" date should update to tomorrow
- Browser console shows: "Recurring transaction executed: ..."

### 3. Pause/Resume Recurring Transaction

**Steps:**
1. Go to Recurring Transactions page
2. Click the "Active" badge on any recurring transaction
3. Observe status change to "Paused" (gray badge)
4. Click "Paused" badge again

**Expected Results:**
- Badge changes between "Active" (blue) and "Paused" (gray)
- When paused, transaction becomes semi-transparent (50% opacity)
- Paused transactions won't be processed automatically
- Resume returns it to active processing

### 4. Filter Recurring Transactions

**Steps:**
1. Create multiple recurring transactions (some active, some paused)
2. Click filter tabs: All / Active / Paused

**Expected Results:**
- "All" shows total count with all transactions
- "Active" shows only active transactions
- "Paused" shows only paused transactions
- Counts in tabs update correctly

### 5. Delete Recurring Transaction

**Steps:**
1. Go to Recurring Transactions page
2. Click the trash icon on any recurring transaction
3. Confirm deletion in the dialog

**Expected Results:**
- Confirmation dialog appears
- Transaction is removed from the list
- Stats update accordingly (monthly income/expenses)
- No future transactions will be created

### 6. Test Multiple Frequencies

Create recurring transactions with different frequencies and verify next date calculation:

| Frequency | Start Date | Expected Next Date |
|-----------|------------|-------------------|
| Daily | Jan 1 | Jan 2 |
| Weekly | Jan 1 (Mon) | Jan 8 (Mon) |
| Bi-weekly | Jan 1 | Jan 15 |
| Monthly | Jan 31 | Feb 28/29 |
| Quarterly | Jan 1 | Apr 1 |
| Yearly | Jan 1 | Next year Jan 1 |

### 7. Test Edge Cases

**Test Case 1: No Accounts**
- Navigate to /recurring/new without creating accounts
- Should show "No Accounts Yet" message
- Should redirect to account creation

**Test Case 2: Multiple Due Transactions**
- Create 3 recurring transactions with today's date
- Wait for processor
- All 3 should execute and show separate notifications

**Test Case 3: Monthly End Dates**
- Create recurring transaction on Jan 31 (monthly)
- After execution, verify next date is Feb 28 (or 29 in leap years)
- Ensure no date overflow errors

### 8. Test Data Persistence

**Steps:**
1. Create several recurring transactions
2. Refresh the browser page
3. Check recurring transactions list

**Expected Results:**
- All recurring transactions persist after refresh
- Processor continues running
- Next scheduled dates are maintained

### 9. Verify Statistics

**Steps:**
1. Create recurring transactions:
   - Monthly income: $3000
   - Monthly rent: $1200
   - Monthly utilities: $300
2. Check Recurring Transactions page stats

**Expected Results:**
- Monthly Income card shows: $3,000.00
- Monthly Expenses card shows: $1,500.00
- Both cards have "Auto" badges

### 10. Test Execution History

**Steps:**
1. Create a daily recurring transaction
2. Wait for it to execute
3. Check the recurring transaction card

**Expected Results:**
- "Last executed" timestamp appears at bottom
- Shows formatted date and time
- Updates each time the recurring transaction runs

## Debugging Tips

### View Processor Logs
Open browser console (F12) to see:
- `"RecurringProcessor started with check interval: 60000ms"`
- `"Checking for due recurring transactions..."`
- `"Recurring transaction executed: ..."` (when transactions run)

### Check IndexedDB
1. Open browser DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB → savena-db
4. Check `recurring` object store for all recurring transactions
5. Check `recurring_history` for execution logs

### Verify Event Dispatching
In browser console, add listener:
```javascript
window.addEventListener('recurring-executed', (e) => {
  console.log('Event received:', e.detail);
});
```

### Force Immediate Execution (For Testing)
In browser console:
```javascript
// Get all recurring transactions
const db = await window.indexedDB.open('savena-db', 1);
// Manually trigger processor
// (You can call processor methods from the module if exported)
```

## Common Issues

### Issue: Transactions not executing
- **Check:** Is the recurring transaction "Active"?
- **Check:** Is the start date in the past or today?
- **Check:** Browser console for errors
- **Solution:** Verify processor is running (should see logs every 60 seconds)

### Issue: Wrong next date
- **Check:** Browser timezone settings
- **Check:** Date format in IndexedDB
- **Solution:** Dates should be ISO strings (YYYY-MM-DD)

### Issue: Multiple executions
- **Check:** Multiple browser tabs open?
- **Solution:** Each tab runs its own processor. Close duplicate tabs.

### Issue: Toast not appearing
- **Check:** ToastContainer is mounted in App.jsx
- **Check:** Event listener is registered
- **Solution:** Verify `window.addEventListener('recurring-executed', ...)` in ToastContainer

## Performance Testing

### Test with Many Recurring Transactions
1. Create 50+ recurring transactions
2. Monitor performance:
   - Check interval execution time (should be <100ms)
   - Page load time
   - IndexedDB query performance

### Test with Long-Running Session
1. Leave app open for 1+ hours
2. Verify processor continues working
3. Check memory usage (shouldn't grow unbounded)

## Success Criteria

✅ All test scenarios pass
✅ No console errors
✅ Transactions execute on schedule
✅ UI updates in real-time
✅ Data persists across sessions
✅ Performance remains smooth with many recurring transactions
✅ Toast notifications appear correctly
✅ Statistics calculate accurately

## Notes

- The processor checks every 60 seconds by default
- All dates use the user's local timezone
- Execution history is stored for future auditing features
- System handles edge cases like month-end dates
- Multiple recurring transactions can execute simultaneously
