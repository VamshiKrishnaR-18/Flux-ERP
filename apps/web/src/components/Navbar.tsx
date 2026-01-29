import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  userName: string;
  onLogout: () => void;
}

export function Navbar({ userName, onLogout }: NavbarProps) {
  const location = useLocation();

  // Helper to highlight the active link
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) => 
    `text-sm font-medium transition-colors ${
      isActive(path) ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-10">
      
      {/* 1. Left Side: Logo & Navigation */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
          <span className="text-lg font-bold tracking-tight text-gray-900">Flux ERP</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className={linkClass('/')}>Dashboard</Link>
          <Link to="/invoices" className={linkClass('/invoices')}>Invoices</Link>
          {/* <Link to="/clients" className={linkClass('/clients')}>Clients</Link> */}
        </div>
      </div>

      {/* 2. Right Side: User & Logout */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-right hidden sm:block">
          <p className="font-medium text-gray-900">{userName}</p>
        </div>
        <button 
          onClick={onLogout} 
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm font-medium transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}