import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotePDF } from '../../features/quotes/components/QuotePDF';
import { ArrowLeft, Download, Mail, FileText, Trash2, Check, X, Loader2 } from 'lucide-react';
import type { Quote, SettingsDTO } from '@erp/types';

export default function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<SettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [quoteRes, settingsRes] = await Promise.all([
          api.get(`/quotes/${id}`),
          api.get('/settings')
        ]);
        setQuote(quoteRes.data.data);
        setSettings(settingsRes.data.data);
      } catch {
        toast.error("Failed to load quote");
        navigate('/quotes');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) loadData();
  }, [id, navigate]);

  const handleSendEmail = async () => {
      setIsSending(true);
      try {
          await api.post(`/quotes/${id}/send`);
          toast.success("Quote sent to client!");
          // Refresh to update status
          const res = await api.get(`/quotes/${id}`);
          setQuote(res.data.data);
      } catch {
          toast.error("Failed to send email");
      } finally {
          setIsSending(false);
      }
  };

  const handleConvert = async () => {
	    if(!confirm("Create an Invoice from this accepted quote?")) return;
      try {
          const res = await api.post(`/quotes/${id}/convert`);
          toast.success("Converted to Invoice!");
          navigate(`/invoices/${res.data.data._id}`);
      } catch {
          toast.error("Failed to convert");
      }
  };

	const handleUpdateStatus = async (status: 'accepted' | 'rejected') => {
		setIsUpdatingStatus(true);
		try {
			await api.patch(`/quotes/${id}/status`, { status });
			toast.success(`Marked as ${status}`);
			const res = await api.get(`/quotes/${id}`);
			setQuote(res.data.data);
		} catch (error: unknown) {
			const err = error as { response?: { data?: { message?: string } } };
			toast.error(err.response?.data?.message || 'Failed to update status');
		} finally {
			setIsUpdatingStatus(false);
		}
	};

  const handleDelete = async () => {
    if(!confirm("Are you sure you want to delete this quote?")) return;
    try {
        await api.delete(`/quotes/${id}`);
        toast.success("Quote deleted");
        navigate('/quotes');
    } catch {
        toast.error("Failed to delete quote");
    }
  };

  if (isLoading || !quote) return <div className="p-10 text-center flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-950 transition-colors"><div className="animate-spin w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div></div>;

  const client = quote.clientId as unknown as { name: string, email: string, phoneNumber?: string, address?: string };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 lg:p-10 transition-colors duration-200">
      <main className="max-w-4xl mx-auto">
        
        {/* HEADER ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <button onClick={() => navigate('/quotes')} className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Quotes
          </button>
          
	          <div className="flex flex-wrap items-center gap-3">
            {/* Delete Button */}
            <button 
                onClick={handleDelete}
                className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                title="Delete"
            >
               <Trash2 className="w-5 h-5" />
            </button>

	            {/* Accept / Reject (manual workflow) */}
	            {quote.status === 'sent' && (
	              <>
	                <button
	                  onClick={() => handleUpdateStatus('accepted')}
	                  disabled={isUpdatingStatus}
	                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm"
	                  title="Mark as accepted"
	                >
	                  <Check className="w-4 h-4" /> Accept
	                </button>
	                <button
	                  onClick={() => handleUpdateStatus('rejected')}
	                  disabled={isUpdatingStatus}
	                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm"
	                  title="Mark as rejected"
	                >
	                  <X className="w-4 h-4" /> Reject
	                </button>
	              </>
	            )}

            {/* Convert Button */}
	            {quote.status === 'accepted' && (
                <button onClick={handleConvert} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm">
                   <FileText className="w-4 h-4" /> Convert to Invoice
                </button>
            )}
            
            {/* Email Button */}
            <button 
                onClick={handleSendEmail} 
	                disabled={isSending || quote.status === 'converted'}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm"
            >
               <Mail className="w-4 h-4" /> {isSending ? 'Sending...' : 'Email Client'}
            </button>

            {/* Download PDF Button */}
            <PDFDownloadLink
              document={<QuotePDF quote={quote} settings={settings ?? undefined} />}
              fileName={`quote-${quote.number}.pdf`}
              className="px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2 font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              {({ loading }) => (
                <>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download PDF
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {/* QUOTE PAPER UI */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden relative transition-colors">
          
           {/* Banner */}
           <div className="p-10 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start gap-6">
             <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{settings?.companyName || 'Your Company'}</h1>
                <div className="text-gray-500 dark:text-slate-400 text-sm mt-2 font-medium">
                   <p>{settings?.companyEmail}</p>
                </div>
             </div>
             <div className="text-right flex flex-col items-end">
                <h2 className="text-5xl font-black text-blue-600/10 dark:text-blue-400/10 uppercase tracking-[0.2em] mb-2 select-none">Quote</h2>
                <p className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">#{quote.number}</p>
	                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase mt-3 inline-block border tracking-widest ${
	                    quote.status === 'converted' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/20' :
	                    quote.status === 'accepted' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
	                    quote.status === 'rejected' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' :
	                    quote.status === 'sent' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' : 
                      'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'
	                }`}>
                    {quote.status}
                </span>
             </div>
           </div>

           {/* Details */}
           <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-12 border-b border-gray-100 dark:border-slate-800">
              <div>
                 <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Prepared For</h3>
                 <p className="font-black text-xl text-gray-900 dark:text-slate-100">{client?.name}</p>
                 <p className="text-gray-500 dark:text-slate-400 font-medium">{client?.email}</p>
              </div>
              <div className="sm:text-right">
                 <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Expiry Date</h3>
                 <p className="font-black text-xl text-gray-900 dark:text-slate-100">{new Date(quote.expiredDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
           </div>

           {/* Items Table */}
           <div className="p-10">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                   <tr>
                     <th className="pb-4">Item & Description</th>
                     <th className="pb-4 text-center w-24">Qty</th>
                     <th className="pb-4 text-right w-32">Price</th>
                     <th className="pb-4 text-right w-32">Total</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                   {quote.items.map((item, idx) => (
                     <tr key={idx} className="group">
                       <td className="py-6 pr-4">
                         <p className="font-bold text-gray-900 dark:text-slate-100">{item.itemName}</p>
                       </td>
                       <td className="py-6 text-center text-gray-600 dark:text-slate-400 font-medium">{item.quantity}</td>
                       <td className="py-6 text-right text-gray-600 dark:text-slate-400 font-medium">${item.price.toFixed(2)}</td>
                       <td className="py-6 text-right font-bold text-gray-900 dark:text-slate-100">${(item.quantity * item.price).toFixed(2)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>

           {/* Footer Total */}
           <div className="p-10 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <div className="w-full sm:w-72 space-y-3">
                 {quote.discount > 0 && (
                    <div className="flex justify-between text-gray-500 dark:text-slate-400 text-sm font-medium">
                       <span>Discount</span>
                       <span className="text-red-500 dark:text-red-400">-${quote.discount.toFixed(2)}</span>
                    </div>
                 )}
                 <div className="flex justify-between items-center text-2xl font-black text-gray-900 dark:text-slate-100 border-t pt-4 border-gray-200 dark:border-slate-700">
                    <span className="text-sm font-black uppercase tracking-[0.1em] text-gray-400 dark:text-slate-500">Estimated Total</span>
                    <span>${quote.total.toFixed(2)}</span>
                 </div>
              </div>
           </div>

        </div>
      </main>
    </div>
  );
}
