import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Settings, 
  LogOut, 
  TrendingDown,
  MessageSquareQuote
} from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-10">
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            F
          </div>
          <span className="text-xl font-bold text-gray-900">Flux ERP</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">
          Overview
        </p>
        <NavLink to="/" className={linkClass}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
        </NavLink>

        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
          Management
        </p>
        <NavLink to="/clients" className={linkClass}>
            <Users className="w-5 h-5" />
            <span>Clients</span>
        </NavLink>
        <NavLink to="/products" className={linkClass}>
            <Package className="w-5 h-5" />
            <span>Products</span>
        </NavLink>
        <NavLink to="/quotes" className={linkClass}>
            <MessageSquareQuote className="w-5 h-5" />
            <span>Quotes</span>
        </NavLink>
        <NavLink to="/invoices" className={linkClass}>
            <FileText className="w-5 h-5" />
            <span>Invoices</span>
        </NavLink>
        <NavLink to="/expenses" className={linkClass}>
            <TrendingDown className="w-5 h-5" />
            <span>Expenses</span>
        </NavLink>

        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
          System
        </p>
        <NavLink to="/settings" className={linkClass}>
            <Settings className="w-5 h-5" />
            <span>Settings</span>
        </NavLink>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};