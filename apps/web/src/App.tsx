import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layouts
import ProtectedLayout from './pages/ProtectedLayout';
import { Layout } from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Clients from './pages/Clients';
import InvoiceList from './pages/InvoiceList';
import InvoiceView from './pages/InvoiceView';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceEdit from './pages/InvoiceEdit';
import Settings from './pages/Settings';
import Products from './pages/Products';

export default function App() {
  return (
    // ✅ FIX: The Router must wrap the entire application
    <BrowserRouter>
      <Toaster position="top-right" richColors />

      <Routes>
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