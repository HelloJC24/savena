import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import NewAccount from './pages/NewAccount';
import AccountDetail from './pages/AccountDetail';
import Transactions from './pages/Transactions';
import NewTransaction from './pages/NewTransaction';
import TransactionDetail from './pages/TransactionDetail';
import RecurringTransactions from './pages/RecurringTransactions';
import NewRecurring from './pages/NewRecurring';
import CurrencySettings from './pages/CurrencySettings';
import Settings from './pages/Settings';
import { useTheme } from './hooks/useTheme';

// Import recurring processor to start automatic processing
import './services/recurringProcessor';

function App() {
  // Initialize theme
  useTheme();

  return (
    <Router>
      <div className="select-none font-sf w-full min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/new" element={<NewAccount />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/new" element={<NewTransaction />} />
          <Route path="/transactions/:id" element={<TransactionDetail />} />
          <Route path="/recurring" element={<RecurringTransactions />} />
          <Route path="/recurring/new" element={<NewRecurring />} />
          <Route path="/currency" element={<CurrencySettings />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App
