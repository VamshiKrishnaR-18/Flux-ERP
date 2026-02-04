import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { Plus, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // 1. Load Settings for Currency
    api.get('/settings').then(res => {
       const curr = res.data.data?.currency;
       if (curr === 'EUR') setCurrencySymbol('€');
       else if (curr === 'GBP') setCurrencySymbol('£');
       else if (curr === 'INR') setCurrencySymbol('₹');
       else setCurrencySymbol('$');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // 2. Fetch Invoices with Pagination
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/invoices?page=${page}&limit=10`); // limit=10 for better UI fit
        setInvoices(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      } catch (error) {
        toast.error("Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <main className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invoices</h1>
            <p className="text-gray-500 mt-1">Manage and track your client billings</p>
          </div>
          <button 
            onClick={() => navigate('/invoices/new')} 
            className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" /> New Invoice
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
            <p className="text-gray-500 mt-1 mb-6">Create your first invoice to get started.</p>
            <button 
                onClick={() => navigate('/invoices/new')} 
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
            >
                Create Invoice
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Number</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr 
                      key={inv._id} 
                      onClick={() => navigate(`/invoices/${inv._id}`)}
                      className="group hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {inv.invoicePrefix}{inv.number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {inv.clientId?.name || <span className="text-gray-400 italic">Unknown Client</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(inv.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(inv.expiredDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                          ${inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 
                            inv.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            inv.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {currencySymbol} {inv.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-sm text-gray-500">
                    Page <span className="font-medium text-gray-900">{page}</span> of {totalPages}
                </span>
                <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all bg-white shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all bg-white shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}