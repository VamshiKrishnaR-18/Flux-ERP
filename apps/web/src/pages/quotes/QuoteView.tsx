import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotePDF } from '../../features/quotes/components/QuotePDF';
import { ArrowLeft, Printer, Download, Mail, FileText, Trash2 } from 'lucide-react';
import type { Quote } from '@erp/types';

export default function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [quoteRes, settingsRes] = await Promise.all([
          api.get(`/quotes/${id}`),
          api.get('/settings')
        ]);
        setQuote(quoteRes.data.data);
        setSettings(settingsRes.data.data);
      } catch (error) {
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
      } catch (error) {
          toast.error("Failed to send email");
      } finally {
          setIsSending(false);
      }
  };

  const handleConvert = async () => {
      if(!confirm("Create an Invoice from this quote?")) return;
      try {
          const res = await api.post(`/quotes/${id}/convert`);
          toast.success("Converted to Invoice!");
          navigate(`/invoices/${res.data.data._id}`);
      } catch (error) {
          toast.error("Failed to convert");
      }
  };

  const handleDelete = async () => {
    if(!confirm("Are you sure you want to delete this quote?")) return;
    try {
        await api.delete(`/quotes/${id}`);
        toast.success("Quote deleted");
        navigate('/quotes');
    } catch (error) {
        toast.error("Failed to delete quote");
    }
  };

  if (isLoading || !quote) return <div className="p-10 text-center">Loading...</div>;

  const client = quote.clientId as any;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <main className="max-w-4xl mx-auto">
        
        {/* HEADER ACTIONS */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/quotes')} className="text-gray-500 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Quotes
          </button>
          
          <div className="flex gap-3">
            {/* Delete Button */}
            <button 
                onClick={handleDelete}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                title="Delete"
            >
               <Trash2 className="w-5 h-5" />
            </button>

            {/* Convert Button */}
            {quote.status !== 'converted' && (
                <button onClick={handleConvert} className="px-4 py-2 bg-white border border-gray-200 text-purple-700 hover:bg-purple-50 rounded-lg font-medium flex items-center gap-2">
                   <FileText className="w-4 h-4" /> Convert to Invoice
                </button>
            )}
            
            {/* Email Button */}
            <button 
                onClick={handleSendEmail} 
                disabled={isSending || quote.status === 'converted'}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
               <Mail className="w-4 h-4" /> {isSending ? 'Sending...' : 'Email Client'}
            </button>

            {/* Download PDF Button */}
            <PDFDownloadLink
              document={<QuotePDF quote={quote} settings={settings} />}
              fileName={`quote-${quote.number}.pdf`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm"
            >
              {({ loading }) => (
                <>
                  {loading ? <Printer className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download PDF
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {/* QUOTE PAPER UI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          
           {/* Banner */}
           <div className="p-8 border-b border-gray-100 flex justify-between items-start">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">{settings?.companyName || 'Your Company'}</h1>
                <div className="text-gray-500 text-sm mt-1">
                   <p>{settings?.companyEmail}</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-4xl font-extrabold text-indigo-100 uppercase tracking-widest mb-2">Quote</h2>
                <p className="text-lg font-bold text-gray-700">#{quote.number}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase mt-2 inline-block ${
                    quote.status === 'converted' ? 'bg-purple-100 text-purple-800' :
                    quote.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {quote.status}
                </span>
             </div>
           </div>

           {/* Details */}
           <div className="p-8 grid grid-cols-2 gap-12">
              <div>
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prepared For</h3>
                 <p className="font-bold text-lg">{client?.name}</p>
                 <p className="text-gray-500">{client?.email}</p>
              </div>
              <div className="text-right">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expiry Date</h3>
                 <p className="font-medium text-gray-900">{new Date(quote.expiredDate).toLocaleDateString()}</p>
              </div>
           </div>

           {/* Items Table */}
           <div className="px-8 pb-8">
             <table className="w-full text-left">
               <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                 <tr>
                   <th className="px-4 py-3 rounded-l-lg">Item</th>
                   <th className="px-4 py-3 text-right">Qty</th>
                   <th className="px-4 py-3 text-right">Price</th>
                   <th className="px-4 py-3 text-right rounded-r-lg">Total</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {quote.items.map((item, idx) => (
                   <tr key={idx}>
                     <td className="px-4 py-4 font-medium text-gray-900">{item.itemName}</td>
                     <td className="px-4 py-4 text-right text-gray-600">{item.quantity}</td>
                     <td className="px-4 py-4 text-right text-gray-600">${item.price.toFixed(2)}</td>
                     <td className="px-4 py-4 text-right font-medium text-gray-900">${(item.quantity * item.price).toFixed(2)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>

           {/* Footer Total */}
           <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
              <div className="w-64 space-y-2">
                 {quote.discount > 0 && (
                    <div className="flex justify-between text-gray-500 text-sm">
                       <span>Discount</span>
                       <span>-${quote.discount.toFixed(2)}</span>
                    </div>
                 )}
                 <div className="flex justify-between items-center text-xl font-bold text-gray-900 border-t pt-2 border-gray-200">
                    <span>Estimated Total</span>
                    <span>${quote.total.toFixed(2)}</span>
                 </div>
              </div>
           </div>

        </div>
      </main>
    </div>
  );
}