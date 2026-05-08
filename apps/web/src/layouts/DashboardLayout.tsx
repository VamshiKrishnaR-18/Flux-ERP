import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Search, FileText, Package, Users } from 'lucide-react';
import Sidebar from './Sidebar';
import { useDebounce } from '../hooks/useDebounce';
import { api } from '../lib/axios';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDemoMode } from '../context/DemoModeContext';
import { AIChatbot } from '../components/AIChatbot';

type SearchResults = {
  clients: Array<{ _id: string; name: string; email?: string; phoneNumber?: string }>;
  invoices: Array<{ _id: string; number: number; invoicePrefix?: string; status?: string; total?: number; clientId?: { name?: string } }>;
  products: Array<{ _id: string; name: string; sku?: string; price?: number; stock?: number }>;
};

export const Layout = () => {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ clients: [], invoices: [], products: [] });
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    '/': () => searchInputRef.current?.focus(),
    'mod+k': () => searchInputRef.current?.focus(),
    'i': () => navigate('/invoices'),
    'p': () => navigate('/products'),
    'c': () => navigate('/clients'),
    'd': () => navigate('/dashboard'),
    'n': () => navigate('/invoices/new'),
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setResults({ clients: [], invoices: [], products: [] });
      setIsOpen(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    api.get(`/dashboard/search?q=${encodeURIComponent(q)}`)
      .then(res => {
        if (!active) return;
        setResults(res.data.data || { clients: [], invoices: [], products: [] });
        setIsOpen(true);
      })
      .catch(() => {
        if (!active) return;
        setResults({ clients: [], invoices: [], products: [] });
        setIsOpen(true);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const hasResults = results.clients.length + results.invoices.length + results.products.length > 0;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 ml-64 overflow-auto">
        {isDemoMode && (
          <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 text-center sticky top-0 z-30">
            Demo Mode Active &bull; Data is simulated and will reset on page reload
          </div>
        )}
        <div className={`sticky ${isDemoMode ? 'top-[20px]' : 'top-0'} z-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors duration-200`}>
          <div className="px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div ref={searchRef} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                  }}
                  onFocus={() => {
                    if (debouncedQuery.trim()) setIsOpen(true);
                  }}
                  placeholder="Search clients, invoices, products..."
                  className="w-full pl-10 pr-16 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md">K</kbd>
                </div>
                {isOpen && (
                  <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                    {isLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">Searching...</div>
                    ) : !hasResults ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">No matches found</div>
                    ) : (
                      <div className="max-h-96 overflow-auto">
                        {results.clients.length > 0 && (
                          <div className="border-b border-gray-100 dark:border-slate-800">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                              <Users className="w-3.5 h-3.5" />
                              Clients
                            </div>
                            {results.clients.map((client) => (
                              <button
                                key={client._id}
                                onClick={() => {
                                  navigate(`/clients/${client._id}`);
                                  setIsOpen(false);
                                  setQuery('');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{client.name}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{client.email || client.phoneNumber || 'No contact info'}</div>
                              </button>
                            ))}
                          </div>
                        )}
                        {results.invoices.length > 0 && (
                          <div className="border-b border-gray-100 dark:border-slate-800">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" />
                              Invoices
                            </div>
                            {results.invoices.map((invoice) => (
                              <button
                                key={invoice._id}
                                onClick={() => {
                                  navigate(`/invoices/${invoice._id}`);
                                  setIsOpen(false);
                                  setQuery('');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                  {(invoice.invoicePrefix || '') + invoice.number}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">
                                  {invoice.clientId?.name || 'Unknown Client'}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {results.products.length > 0 && (
                          <div>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                              <Package className="w-3.5 h-3.5" />
                              Products
                            </div>
                            {results.products.map((product) => (
                              <button
                                key={product._id}
                                onClick={() => {
                                  navigate(`/products?search=${encodeURIComponent(product.name)}`);
                                  setIsOpen(false);
                                  setQuery('');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{product.name}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{product.sku || 'No SKU'}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </div>

      {/* Floating AI Chatbot */}
      <AIChatbot />
    </div>
  );
};
