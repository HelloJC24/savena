# Savena - Virtual Bank App 💰

A modern, iOS-friendly Progressive Web App (PWA) for tracking your finances. Built with React, Tailwind CSS, and IndexedDB for offline-first functionality.

## Features

✨ **Core Features**
- 📊 Multiple account management
- 💵 Track deposits and withdrawals
- 📝 Detailed transaction descriptions
- 🏷️ Transaction categories
- 📅 Date-based filtering and sorting
- 💾 Local storage with IndexedDB
- 🔄 Ready for API integration (Fruitask Developer API)
- 📱 PWA support for offline usage

🤖 **Recurring Transactions** (NEW!)
- ⏰ Automatic transaction processing
- 📆 Multiple frequency options (daily, weekly, biweekly, monthly, quarterly, yearly)
- ✅ Smart scheduling with automatic execution
- 🔔 Real-time notifications when transactions are processed
- ⏸️ Pause/resume recurring transactions
- 📊 Track execution history

📈 **Analytics & Insights**
- 📊 Interactive charts (pie chart for categories, bar chart for trends)
- 💹 Real-time statistics (deposits, withdrawals, net flow, averages)
- 📅 Period selection (monthly/yearly views)
- 📈 Monthly overview on dashboard

🎨 **iOS-Friendly Design**
- Clean, modern interface inspired by iOS design patterns
- Smooth animations and transitions
- Touch-optimized components
- Native-like experience on mobile devices
- Bottom navigation for easy thumb access

## Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS with custom iOS theme
- **Routing**: React Router v6
- **Database**: IndexedDB (via idb library)
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 20.11+ (or compatible version)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and visit `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
savena/
├── public/                 # Static assets and PWA icons
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── BottomNav.jsx
│   │   ├── Header.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── AccountCard.jsx
│   │   ├── TransactionItem.jsx
│   │   ├── RecurringItem.jsx (NEW!)
│   │   ├── StatCard.jsx
│   │   ├── CategoryChart.jsx
│   │   ├── TrendChart.jsx
│   │   ├── Modal.jsx
│   │   └── ToastContainer.jsx (NEW!)
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Accounts.jsx
│   │   ├── NewAccount.jsx
│   │   ├── Transactions.jsx
│   │   ├── NewTransaction.jsx
│   │   ├── RecurringTransactions.jsx (NEW!)
│   │   ├── NewRecurring.jsx (NEW!)
│   │   └── Settings.jsx
│   ├── services/         # Business logic and data services
│   │   ├── db.js                    # Core IndexedDB operations
│   │   ├── recurringDB.js (NEW!)    # Recurring transactions DB
│   │   ├── recurringProcessor.js (NEW!) # Automatic processor
│   │   └── api.js                   # API integration layer
│   ├── utils/            # Utility functions
│   │   ├── currency.js
│   │   ├── date.js
│   │   └── constants.js
│   ├── App.jsx          # Main app component with routing
│   └── index.css        # Global styles with iOS design tokens
├── vite.config.js       # Vite and PWA configuration
└── tailwind.config.js   # Tailwind with custom iOS theme
```

## How Recurring Transactions Work

The recurring transactions feature provides fully automated transaction processing:

### 1. **Creating Recurring Transactions**
- Navigate to Settings → Recurring Transactions → Add New
- Select transaction type (income/expense), account, amount, and category
- Choose frequency: Daily, Weekly, Bi-weekly, Monthly, Quarterly, or Yearly
- Set start date and the system will calculate all future execution dates

### 2. **Automatic Processing**
- The `recurringProcessor` service runs every 60 seconds in the background
- Checks all active recurring transactions for due dates
- Automatically creates real transactions when the scheduled time arrives
- Updates the next execution date based on frequency
- Tracks execution history for auditing

### 3. **Notifications**
- Real-time toast notifications appear when transactions are processed
- Shows transaction description and amount
- Color-coded: green for income, blue for expenses

### 4. **Management**
- View all recurring transactions with filtering (all/active/paused)
- Pause/resume recurring transactions without deleting them
- Delete recurring transactions permanently
- View execution history and next scheduled date
- See monthly income and expense projections

## API Integration

The app is ready for integration with the Fruitask Developer API. Configure in `src/services/api.js`:

```javascript
const API_BASE_URL = 'https://api.fruitask.com';
const API_KEY = 'your-api-key-here';
```

## License

MIT License

---

Built with ❤️ using React and Tailwind CSS
