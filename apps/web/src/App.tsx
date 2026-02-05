import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
// 👇 Import the new modal
import { SessionExpiryModal } from './components/SessionExpiryModal';

// ... (Keep existing Layout and Page imports) ...
import {Layout as DashboardLayout} from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import LandingLayout from './layouts/LandingLayout'; // ✅ New Landing Layout
import ProtectedLayout from './layouts/ProtectedLayout';
import AdminRoute from './components/AdminRoute';

import Landing from './pages/Landing'; // ✅ New Landing Page
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword'; // ✅ Import
import ResetPassword from './pages/auth/ResetPassword';   // ✅ Import
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceCreate from './pages/invoices/InvoiceCreate';
import InvoiceEdit from './pages/invoices/InvoiceEdit';
import InvoiceView from './pages/invoices/InvoiceView';
import InvoicePublic from './pages/public/InvoicePublic';
import ClientPortalPublic from './pages/public/ClientPortalPublic';
import QuoteList from './pages/quotes/QuoteList';
import QuoteCreate from './pages/quotes/QuoteCreate';
import QuoteView from './pages/quotes/QuoteView';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page (Root) */}
      <Route element={<LandingLayout><Landing /></LandingLayout>} path="/" />

      {/* Public Auth Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> {/* ✅ New Route */}
        <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* ✅ New Route */}
        <Route path="/p/invoice/:id" element={<InvoicePublic />} />
        <Route path="/portal/:token" element={<ClientPortalPublic />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route element={<DashboardLayout />}>
          {/* <Route path="/" element={<Navigate to="/dashboard" replace />} />  <-- Removed this redirect */}
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

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
             <Route path="/expenses" element={<Expenses />} />
             <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {/* ✅ PLACE MODAL HERE: It must be inside AuthProvider but outside Routes */}
          <SessionExpiryModal />
          
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}