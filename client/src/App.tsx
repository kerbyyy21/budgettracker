import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionNew from './pages/TransactionNew';
import TransactionEdit from './pages/TransactionEdit';
import Wallets from './pages/Wallets';
import WalletDetail from './pages/WalletDetail';
import Categories from './pages/Categories';
import Budget from './pages/Budget';
import Savings from './pages/Savings';
import SavingsDetail from './pages/SavingsDetail';
import Reports from './pages/Reports';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="transactions/new" element={<TransactionNew />} />
        <Route path="transactions/:id/edit" element={<TransactionEdit />} />
        <Route path="wallets" element={<Wallets />} />
        <Route path="wallets/:id" element={<WalletDetail />} />
        <Route path="categories" element={<Categories />} />
        <Route path="budget" element={<Budget />} />
        <Route path="savings" element={<Savings />} />
        <Route path="savings/:id" element={<SavingsDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
