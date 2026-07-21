import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Package, 
  Receipt, Settings, LogOut, FileCode, PieChart, Activity,
  Sun, Moon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar() {
  const { logout, user } = useAuth(); 
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const LINKS = [
    { to: '/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { to: '/clients', label: t('sidebar.clients'), icon: Users },
    { to: '/products', label: t('sidebar.products'), icon: Package },
    { to: '/invoices', label: t('sidebar.invoices'), icon: FileText },
    { to: '/quotes', label: t('sidebar.quotes'), icon: FileCode },
    { to: '/activity', label: t('sidebar.activity'), icon: Activity },
    { to: '/settings', label: t('sidebar.settings'), icon: Settings },
  
    ...(user?.role === 'admin' ? [
        { to: '/expenses', label: t('sidebar.expenses'), icon: Receipt },
        { to: '/reports', label: t('sidebar.reports'), icon: PieChart },
    ] : [])
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 transition-colors duration-200">
      <div className="p-6 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.svg" alt="Flux ERP Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Flux ERP
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30">
            Demo
          </span>
        </div>
        
        <span className="text-[10px] uppercase font-black text-gray-400 dark:text-slate-500 tracking-[0.2em] block ml-11">
            {user?.role} {t('sidebar.workspace')}
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
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-2">
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl w-full transition-colors font-medium"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-5 h-5" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-5 h-5" />
              <span>Light Mode</span>
            </>
          )}
        </button>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl w-full transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}