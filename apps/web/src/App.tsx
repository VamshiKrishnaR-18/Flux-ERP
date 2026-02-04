import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext'; // 👈 Import

// Layouts
import {Layout} from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import ProtectedLayout from './layouts/ProtectedLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceCreate from './pages/invoices/InvoiceCreate';
import InvoiceEdit from './pages/invoices/InvoiceEdit';
import InvoiceView from './pages/invoices/InvoiceView';
import InvoicePublic from './pages/public/InvoicePublic';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import QuoteList from './pages/quotes/QuoteList';
import QuoteCreate from './pages/quotes/QuoteCreate';
import QuoteView from './pages/quotes/QuoteView';

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/p/invoice/:id" element={<InvoicePublic />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/clients" element={<Clients />} />
          <Route path="/products" element={<Products />} />
          
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/new" element={<InvoiceCreate />} />
          <Route path="/invoices/:id" element={<InvoiceView />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />

          <Route path="/quotes" element={<QuoteList />} />
          <Route path="/quotes/new" element={<QuoteCreate />} />
          <Route path="/quotes/:id" element={<QuoteView />} />

          <Route path="/expenses" element={<Expenses />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* ✅ AuthProvider must be inside BrowserRouter because it uses useNavigate */}
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}