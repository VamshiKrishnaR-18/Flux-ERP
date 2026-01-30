import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Pages
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Settings from './pages/Settings';   // ✅ Import Settings
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceList from './pages/InvoiceList';
import InvoiceEdit from './pages/InvoiceEdit';

// Layouts
import ProtectedLayout from './pages/ProtectedLayout';
import { Layout } from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Area */}
        <Route element={<ProtectedLayout />}>
          
          <Route element={<Layout />}>
            
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
           
            <Route path="/settings" element={<Settings />} />  {/* Added */}

            {/* Invoice Routes */}
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<InvoiceCreate />} />
            <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />

          </Route> {/* ...and Close Layout Wrapper HERE */}

        </Route>
      </Routes>
    </BrowserRouter>
  );
}