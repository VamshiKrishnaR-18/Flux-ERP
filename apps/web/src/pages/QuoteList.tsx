import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { Plus, FileOutput, ArrowRightLeft, Send } from 'lucide-react'; // ✅ Import Send
import type { Quote } from '@erp/types';

export default function QuoteList() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Quotes
  const fetchQuotes = async () => {
    try {
      const res = await api.get('/quotes');
      setQuotes(res.data.data);
    } catch (error) {
      toast.error("Failed to load quotes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, []);

  // ⚡ Convert Logic
  const handleConvert = async (id: string) => {
    if(!confirm("Convert this quote to an invoice?")) return;
    
    const toastId = toast.loading("Converting...");
    try {
      const res = await api.post(`/quotes/${id}/convert`);
      toast.success("Converted successfully!", { id: toastId });
      navigate(`/invoices/${res.data.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Conversion failed", { id: toastId });
    }
  };

  // 📧 Send Logic
  const handleSend = async (id: string) => {
    const toastId = toast.loading("Sending quote...");
    try {
      await api.post(`/quotes/${id}/send`);
      toast.success("Quote sent!", { id: toastId });
      fetchQuotes(); // Refresh to see status change
    } catch (error) {
      toast.error("Failed to send", { id: toastId });
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
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
                <p className="text-gray-500">Manage estimates and proposals</p>
            </div>
            <button 
                onClick={() => navigate('/quotes/new')}
                className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800"
            >
                <Plus className="w-4 h-4" /> Create Quote
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                    <tr>
                        <th className="px-6 py-4">Number</th>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {quotes.map((quote) => (
                        <tr key={quote._id} className="hover:bg-gray-50 group">
                            <td className="px-6 py-4 font-medium">#{quote.number}</td>
                            <td className="px-6 py-4 text-gray-600">{quote.title}</td>
                            <td className="px-6 py-4 text-gray-600">
                                {typeof quote.clientId === 'object' ? (quote.clientId as any).name : '...'}
                            </td>
                            <td className="px-6 py-4 text-right font-medium">${quote.total.toFixed(2)}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(quote.status)}`}>
                                    {quote.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    
                                    {/* ✅ 1. SEND BUTTON (Only for Drafts) */}
                                    {quote.status === 'draft' && (
                                        <button 
                                            onClick={() => handleSend(quote._id)}
                                            className="text-blue-500 hover:text-blue-700 transition-colors"
                                            title="Send Email"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* ✅ 2. CONVERT BUTTON (If not converted) */}
                                    {quote.status !== 'converted' && (
                                        <button 
                                            onClick={() => handleConvert(quote._id)}
                                            className="text-purple-600 hover:text-purple-900 font-medium text-sm flex items-center gap-1"
                                            title="Convert to Invoice"
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* 3. Converted Badge */}
                                    {quote.status === 'converted' && (
                                        <span className="text-gray-400 text-xs flex items-center gap-1">
                                            <FileOutput className="w-3 h-3" /> Converted
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {quotes.length === 0 && !isLoading && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">No quotes found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </main>
    </div>
  );
}