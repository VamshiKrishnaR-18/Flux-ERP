import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedLayout from './pages/ProtectedLayout';
// 1. IMPORT INVOICE PAGES
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceList from './pages/InvoiceList';
import InvoiceEdit from './pages/InvoiceEdit';

export default function App() {
  return (
    <BrowserRouter>
      {/* 2. Toaster is already here, perfect! */}
      <Toaster position="top-right" richColors />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          
          {/* 3. ADD INVOICE ROUTES 👇 */}
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/new" element={<InvoiceCreate />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}