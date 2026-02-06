import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Package, 
  Receipt, Settings, LogOut, FileCode, PieChart
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const { logout, user } = useAuth(); // 👈 Get user from hook

  const LINKS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/invoices', label: 'Invoices', icon: FileText },
    { to: '/quotes', label: 'Quotes', icon: FileCode },
    { to: '/reports', label: 'Reports', icon: PieChart }, // ✅ Reports
    // 🛡️ Hide these from non-admins
    ...(user?.role === 'admin' ? [
        { to: '/expenses', label: 'Expenses', icon: Receipt },
        { to: '/settings', label: 'Settings', icon: Settings },
    ] : [])
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Flux ERP
        </h1>
        {/* Optional: Show role badge */}
        <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
            {user?.role} Workspace
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-medium shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl w-full transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}