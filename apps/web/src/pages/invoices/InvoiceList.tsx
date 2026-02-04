import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios'; 
import type { Invoice } from '@erp/types';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '../../features/invoices/components/InvoicePDF';
import { Eye, Send, Search, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { useSearch } from '../../hooks/useSearch'; 

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  // Search Logic (Note: Currently filters only the visible page)
  const { query, setQuery, filteredItems: filteredInvoices } = useSearch(invoices, ['number', 'clientId.name', 'status']);

  // ✅ Fetch Data with Pagination
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [invRes, setRes] = await Promise.all([
          // Pass page & limit parameters
          api.get(`/invoices?page=${page}&limit=${LIMIT}&t=${Date.now()}`), 
          api.get('/settings')
        ]);
        
        const invData = invRes.data.data || [];
        const pagination = invRes.data.pagination || { totalPages: 1 };

        setInvoices(Array.isArray(invData) ? invData : []);
        setTotalPages(pagination.totalPages);
        setSettings(setRes.data.data);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page]); // 👈 Re-run when page changes

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices(prev => prev.filter(inv => inv._id !== id));
      toast.success('Invoice deleted successfully');
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleSend = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const toastId = toast.loading("Sending invoice...");
    try {
      await api.post(`/invoices/${id}/send`);
      setInvoices(prev => prev.map(inv => 
        inv._id === id ? { ...inv, status: 'sent' } : inv
      ));
      toast.success("Invoice sent successfully!", { id: toastId });
    } catch (error) {
      toast.error("Failed to send invoice", { id: toastId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200 font-bold';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search visible invoices..." 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>

             <button 
                onClick={() => navigate('/invoices/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
             >
                <span>+</span> Create
             </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🧾</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices found</h3>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-semibold">Number</th>
                      <th className="px-6 py-4 font-semibold">Client</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-gray-900">#{invoice.number}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {typeof invoice.clientId === 'object' ? (invoice.clientId as any).name : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 text-right">
                          ${invoice.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {invoice.status === 'draft' && (
                              <button 
                                onClick={(e) => handleSend(invoice._id, e)}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                title="Mark as Sent"
                              >
                                <Send className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => navigate(`/invoices/${invoice._id}`)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <PDFDownloadLink
                              document={<InvoicePDF invoice={invoice} settings={settings} />}
                              fileName={`invoice-${invoice.number}.pdf`}
                              className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1"
                            >
                              {({ loading }) => (loading ? '...' : 'PDF')}
                            </PDFDownloadLink>
                            <button onClick={() => navigate(`/invoices/${invoice._id}/edit`)} className="text-sm text-gray-500 hover:text-blue-600">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(invoice._id)} className="text-sm text-gray-500 hover:text-red-600">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ✅ Pagination Controls */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
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