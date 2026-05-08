import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { SessionExpiryModal } from './components/SessionExpiryModal';
import {Layout as DashboardLayout} from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import LandingLayout from './layouts/LandingLayout';
import ProtectedLayout from './layouts/ProtectedLayout';
import AdminRoute from './components/AdminRoute';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Products from './pages/Products';
import Reports from './pages/Reports';
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
import ActivityLogs from './pages/ActivityLogs';

import { dark } from '@clerk/themes';
import { useTheme } from './context/ThemeContext';

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
      }}
    >
      <AuthProvider>
        <SessionExpiryModal />
        <AppRoutes />
        <Toaster position="top-right" richColors theme={theme} />
      </AuthProvider>
    </ClerkProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<LandingLayout><Landing /></LandingLayout>} path="/" />

      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/p/invoice/:id" element={<InvoicePublic />} />
        <Route path="/portal/:token" element={<ClientPortalPublic />} />
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/activity" element={<ActivityLogs />} />
          
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/new" element={<InvoiceCreate />} />
          <Route path="/invoices/:id" element={<InvoiceView />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />

          <Route path="/quotes" element={<QuoteList />} />
          <Route path="/quotes/new" element={<QuoteCreate />} />
          <Route path="/quotes/:id" element={<QuoteView />} />

          <Route path="/settings" element={<Settings />} />

          <Route element={<AdminRoute />}>
             <Route path="/expenses" element={<Expenses />} />
             <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DemoModeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </QueryClientProvider>
      </DemoModeProvider>
    </ThemeProvider>
  );
}