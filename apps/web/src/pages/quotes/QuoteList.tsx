import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { Plus, FileOutput, ArrowRightLeft, Send, ArrowUpDown, Search, ChevronLeft, ChevronRight, Loader2, Check, X, Download, FileText } from 'lucide-react';
import { useSortableData } from '../../hooks/useSortableData';
import { useDebounce } from '../../hooks/useDebounce';
import type { Quote } from '@erp/types';
import { EmptyState } from '../../components/EmptyState';

export default function QuoteList() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const LIMIT = 10;

  const { items: sortedQuotes, requestSort, sortConfig } = useSortableData(quotes);
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortConfig.direction === 'ascending' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  useEffect(() => { 
    const fetchQuotes = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/quotes?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`);
        setQuotes(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch {
        toast.error("Failed to load quotes");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotes(); 
  }, [page, debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1); 
  };

  const handleConvert = async (id: string) => {
    if(!confirm("Convert this accepted quote to an invoice?")) return;
    try {
      const res = await api.post(`/quotes/${id}/convert`);
      toast.success("Converted successfully!");
      navigate(`/invoices/${res.data.data._id}`);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : "Conversion failed";
      toast.error(message || "Conversion failed");
    }
  };

  const handleStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await api.patch(`/quotes/${id}/status`, { status });
      toast.success(`Marked as ${status}`);
      const res = await api.get(`/quotes?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`);
      setQuotes(res.data.data);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : 'Failed to update status';
      toast.error(message || 'Failed to update status');
    }
  };

  const handleSend = async (id: string) => {
    try {
      await api.post(`/quotes/${id}/send`);
      toast.success("Quote sent!");
      // Refresh data to show new status
      const res = await api.get(`/quotes?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`);
      setQuotes(res.data.data);
    } catch {
      toast.error("Failed to send");
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await api.get(`/quotes/export/csv${qs}`, { responseType: 'blob' });

      const disposition = (res.headers?.['content-disposition'] as string | undefined) ?? '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const fallback = `quotes-${new Date().toISOString().slice(0, 10)}.csv`;
      const filename = match?.[1] ?? fallback;

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('CSV exported');
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : 'Failed to export CSV';
      toast.error(message || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'converted': return 'bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
        case 'accepted': return 'bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200 dark:border-green-500/20';
        case 'rejected': return 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/20';
        case 'sent': return 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
        default: return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-400 border-gray-200 dark:border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 transition-colors duration-200">
      <main className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Quotes</h1>
              <p className="text-gray-500 dark:text-slate-400 mt-1">Manage and track your estimates</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                 <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search Number, Client, Title..." 
                        value={search} 
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl outline-none text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all shadow-sm" 
                    />
                 </div>
	                <button
	                  onClick={handleExportCsv}
	                  disabled={isExporting}
	                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-60 w-full sm:w-auto"
	                >
	                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
	                  Export CSV
	                </button>
                <button onClick={() => navigate('/quotes/new')} className="bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto"><Plus className="w-5 h-5" /> Create Quote</button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
            {isLoading ? (
                <div className="p-20 text-center text-gray-500 dark:text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin w-6 h-6 border-b-2 border-blue-600 dark:border-blue-400" /> Loading quotes...
                </div>
            ) : quotes.length === 0 ? (
                <EmptyState 
                    title="No quotes found"
                    description="Create your first quote to send to a client."
                    icon={FileText}
                    actionLabel="Create Quote"
                    onAction={() => navigate('/quotes/new')}
                />
            ) : (
                <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-100 dark:border-slate-800 text-xs uppercase tracking-wider cursor-pointer select-none">
                              <tr>
                                  <th className="px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('number')}>Number <SortIcon column="number" /></th>
                                  <th className="px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('title')}>Title <SortIcon column="title" /></th>
                                  <th className="px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('clientId.name')}>Client <SortIcon column="clientId.name" /></th>
                                  <th className="px-6 py-4 text-right hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('total')}>Total <SortIcon column="total" /></th>
                                  <th className="px-6 py-4 text-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('status')}>Status <SortIcon column="status" /></th>
                                  <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                              {sortedQuotes.map((quote: Quote) => (
                                  <tr key={quote._id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all group">
                                      <td className="px-6 py-5 font-bold"><Link to={`/quotes/${quote._id}`} className="text-blue-600 dark:text-blue-400 hover:underline">#{quote.number}</Link></td>
                                      <td className="px-6 py-5 text-gray-900 dark:text-slate-100 font-medium">{quote.title}</td>
                                      <td className="px-6 py-5 text-gray-600 dark:text-slate-400 font-medium">{typeof quote.clientId === 'object' ? (quote.clientId as unknown as { name: string }).name : '...'}</td>
                                      <td className="px-6 py-5 text-right font-black text-gray-900 dark:text-slate-100 text-base">${quote.total.toFixed(2)}</td>
                                      <td className="px-6 py-5 text-center"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize tracking-wider ${getStatusColor(quote.status)}`}>{quote.status}</span></td>
                                      <td className="px-6 py-5 text-right">
                                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              {quote.status === 'draft' && (
                                                  <button onClick={() => handleSend(quote._id)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all" title="Send">
                                                      <Send className="w-4 h-4" />
                                                  </button>
                                              )}

                                              {quote.status === 'sent' && (
                                                  <>
                                                      <button onClick={() => handleStatus(quote._id, 'accepted')} className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all" title="Accept">
                                                          <Check className="w-4 h-4" />
                                                      </button>
                                                      <button onClick={() => handleStatus(quote._id, 'rejected')} className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all" title="Reject">
                                                          <X className="w-4 h-4" />
                                                      </button>
                                                  </>
                                              )}

                                              {quote.status === 'accepted' && (
                                                  <button onClick={() => handleConvert(quote._id)} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all" title="Convert to invoice">
                                                      <ArrowRightLeft className="w-4 h-4" />
                                                  </button>
                                              )}
                                              {quote.status === 'converted' && <span className="text-gray-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><FileOutput className="w-3.5 h-3.5" /> Converted</span>}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-slate-400">Page <span className="font-bold text-gray-900 dark:text-slate-100">{page}</span> of <span className="font-bold text-gray-900 dark:text-slate-100">{totalPages}</span></div>
                      <div className="flex gap-2">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm text-gray-600 dark:text-slate-400">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm text-gray-600 dark:text-slate-400">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                    </div>
                </>
            )}
        </div>
      </main>
    </div>
  );
}