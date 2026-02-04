import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { Plus, FileOutput, ArrowRightLeft, Send, ArrowUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSortableData } from '../../hooks/useSortableData';
import { useSearch } from '../../hooks/useSearch';
import type { Quote } from '@erp/types';

export default function QuoteList() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  const { query, setQuery, filteredItems: filteredQuotes } = useSearch(quotes, ['number', 'title', 'clientId.name']);
  const { items: sortedQuotes, requestSort, sortConfig } = useSortableData(filteredQuotes);
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortConfig.direction === 'ascending' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/quotes?page=${page}&limit=${LIMIT}`);
      setQuotes(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error("Failed to load quotes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, [page]);

  // ... (Keep handleConvert, handleSend, getStatusColor unchanged) ...
  const handleConvert = async (id: string) => {
    if(!confirm("Convert this quote to an invoice?")) return;
    try {
      const res = await api.post(`/quotes/${id}/convert`);
      toast.success("Converted successfully!");
      navigate(`/invoices/${res.data.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Conversion failed");
    }
  };

  const handleSend = async (id: string) => {
    try {
      await api.post(`/quotes/${id}/send`);
      toast.success("Quote sent!");
      fetchQuotes(); 
    } catch (error) {
      toast.error("Failed to send");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'converted': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
        case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <main className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div><h1 className="text-2xl font-bold text-gray-900">Quotes</h1><p className="text-gray-500">Manage estimates</p></div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Search visible quotes..." value={query} onChange={e => setQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none" />
                 </div>
                <button onClick={() => navigate('/quotes/new')} className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 whitespace-nowrap"><Plus className="w-4 h-4" /> Create Quote</button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b cursor-pointer select-none">
                    <tr>
                        <th className="px-6 py-4 hover:bg-gray-100" onClick={() => requestSort('number')}>Number <SortIcon column="number" /></th>
                        <th className="px-6 py-4 hover:bg-gray-100" onClick={() => requestSort('title')}>Title <SortIcon column="title" /></th>
                        <th className="px-6 py-4 hover:bg-gray-100" onClick={() => requestSort('clientId.name')}>Client <SortIcon column="clientId.name" /></th>
                        <th className="px-6 py-4 text-right hover:bg-gray-100" onClick={() => requestSort('total')}>Total <SortIcon column="total" /></th>
                        <th className="px-6 py-4 text-center hover:bg-gray-100" onClick={() => requestSort('status')}>Status <SortIcon column="status" /></th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sortedQuotes.map((quote) => (
                        <tr key={quote._id} className="hover:bg-gray-50 group">
                            <td className="px-6 py-4 font-medium"><Link to={`/quotes/${quote._id}`} className="text-blue-600 hover:underline">#{quote.number}</Link></td>
                            <td className="px-6 py-4 text-gray-600">{quote.title}</td>
                            <td className="px-6 py-4 text-gray-600">{typeof quote.clientId === 'object' ? (quote.clientId as any).name : '...'}</td>
                            <td className="px-6 py-4 text-right font-medium">${quote.total.toFixed(2)}</td>
                            <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(quote.status)}`}>{quote.status}</span></td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {quote.status === 'draft' && <button onClick={() => handleSend(quote._id)} className="text-blue-500 hover:text-blue-700"><Send className="w-4 h-4" /></button>}
                                    {quote.status !== 'converted' && <button onClick={() => handleConvert(quote._id)} className="text-purple-600 hover:text-purple-900"><ArrowRightLeft className="w-4 h-4" /></button>}
                                    {quote.status === 'converted' && <span className="text-gray-400 text-xs flex items-center gap-1"><FileOutput className="w-3 h-3" /> Converted</span>}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ✅ Pagination Controls */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-500">Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span></div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50 flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}