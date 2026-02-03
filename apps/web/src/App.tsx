import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layouts
import ProtectedLayout from './layouts/ProtectedLayout';
import { Layout } from './layouts/DashboardLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Clients from './pages/Clients';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceView from './pages/invoices/InvoiceView';
import InvoiceCreate from './pages/invoices/InvoiceCreate';
import InvoiceEdit from './pages/invoices/InvoiceEdit';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Expenses from './pages/Expenses';
import QuoteList from './pages/quotes/QuoteList';
import QuoteCreate from './pages/quotes/QuoteCreate';
import QuoteView from './pages/quotes/QuoteView';

import PublicLayout from './layouts/PublicLayout';
import InvoicePublic from './pages/public/InvoicePublic';

export default function App() {
  return (
    // ✅ FIX: The Router must wrap the entire application
    <BrowserRouter>
      <Toaster position="top-right" richColors />

      <Routes>

        {/* 🔓 PUBLIC ROUTES (No Login Required) */}
        <Route element={<PublicLayout />}>
            <Route path="/p/invoice/:id" element={<InvoicePublic />} />
        </Route>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedLayout />}>
          <Route element={<Layout />}>
            
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            
            {/* Invoice Routes */}
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<InvoiceCreate />} />
            <Route path="/invoices/:id" element={<InvoiceView />} />
            <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />

            <Route path="/quotes" element={<QuoteList />} />
            <Route path="/quotes/new" element={<QuoteCreate />} />
            <Route path="/quotes/:id" element={<QuoteView />} />

            <Route path="/expenses" element={<Expenses />} />
            
            <Route path="/settings" element={<Settings />} />
            <Route path="/products" element={<Products />} />
            
          </Route>
        </Route>

        {/* Fallback to Dashboard if route not found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}