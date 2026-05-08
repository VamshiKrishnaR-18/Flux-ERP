import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { InvoicePDF } from '../../features/invoices/components/InvoicePDF';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowLeft, Pencil, Download, CreditCard, X, Link as LinkIcon, Loader2, Mail, MapPin } from 'lucide-react'; 
import { StatusBadge } from '../../components/StatusBadge';
import type { Invoice, SettingsDTO } from '@erp/types';
import axios from 'axios';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<SettingsDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isReminding, setIsReminding] = useState(false);

  // Data Loader
  const loadData = useCallback(async () => {
    try {
      const [invoiceRes, settingsRes] = await Promise.all([
        api.get(`/invoices/${id}`),
        api.get('/settings')
      ]);
      setInvoice(invoiceRes.data.data);
      setSettings(settingsRes.data.data);
    } catch {
      toast.error("Failed to load invoice");
      navigate('/invoices');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  // Payment Logic
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(Number(paymentAmount))) return;

    setIsSubmitting(true);
    try {
      await api.post(`/invoices/${id}/payment`, {
        amount: Number(paymentAmount),
        date: new Date(),
        method: 'bank_transfer'
      });

      toast.success("Payment recorded successfully!");
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      await loadData(); 

    } catch (error: unknown) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message 
        : "Failed to record payment";
      toast.error(message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      await api.post(`/invoices/${id}/send`);
      toast.success("Invoice sent to client!");
      await loadData(); // Refresh to update status
    } catch {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleRemind = async () => {
    setIsReminding(true);
    try {
      await api.post(`/invoices/${id}/remind`);
      toast.success("Reminder sent to client!");
    } catch {
      toast.error("Failed to send reminder");
    } finally {
      setIsReminding(false);
    }
  };

  
  const copyPublicLink = () => {
    
    const url = `${window.location.origin}/p/invoice/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard!");
  };

  if (isLoading || !invoice) return (
    <div className="p-20 text-center bg-gray-50/30 dark:bg-slate-950 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-gray-500 dark:text-slate-400 font-medium">Loading invoice...</p>
      </div>
    </div>
  );

  const client = invoice.clientId as unknown as { name: string, email: string, address?: string, phoneNumber?: string };
  const amountPaid = invoice.amountPaid || 0;
  const balanceDue = invoice.total - amountPaid;
  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 pb-20 transition-colors duration-200">
      <main className="max-w-4xl mx-auto">
        
        {/* --- HEADER ACTIONS --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <button 
            onClick={() => navigate('/invoices')} 
            className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 flex items-center gap-2 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
             
             {/* Share Button */}
             <button 
                onClick={copyPublicLink}
                className="flex-1 md:flex-none px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm"
                title="Copy Client Link"
             >
                <LinkIcon className="w-4 h-4" /> Share
             </button>

             {/* Email Button */}
             <button 
                onClick={handleSendEmail}
                disabled={isSending}
                className="flex-1 md:flex-none px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm disabled:opacity-50"
             >
                <Mail className="w-4 h-4" /> {isSending ? 'Sending...' : 'Email'}
             </button>

             {/* Record Payment Button  */}
             {!isPaid && (
                <div className="flex gap-2 flex-1 md:flex-none">
                    {invoice.status === 'overdue' && (
                        <button 
                            onClick={handleRemind}
                            disabled={isReminding}
                            className="flex-1 px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center justify-center gap-2 font-bold text-sm transition-all"
                        >
                            <Mail className="w-4 h-4" /> {isReminding ? 'Reminding...' : 'Remind'}
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            setPaymentAmount(balanceDue.toFixed(2));
                            setIsPaymentModalOpen(true);
                        }}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-emerald-600/10 transition-all"
                    >
                        <CreditCard className="w-4 h-4" /> Pay
                    </button>
                </div>
             )}

            <button 
              onClick={() => navigate(`/invoices/${id}/edit`)}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoice} settings={settings ?? undefined} />}
              fileName={`invoice-${invoice.number}.pdf`}
              className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-blue-600/10 transition-all"
            >
              {({ loading }) => (
                <>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {/* --- INVOICE PAPER UI --- */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-black/5 dark:shadow-none border border-gray-200 dark:border-slate-800 overflow-hidden relative print:shadow-none transition-colors">
          
          {/* PAID STAMP */}
          {isPaid && (
            <div className="absolute top-12 right-12 transform rotate-12 border-8 border-green-500/30 text-green-500/30 text-6xl font-black px-8 py-4 rounded-2xl opacity-50 select-none pointer-events-none z-10 uppercase tracking-tighter">
                Paid
            </div>
          )}

          {/* Top Banner */}
          <div className="p-10 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start gap-8 bg-gray-50/50 dark:bg-slate-800/30">
              <div>
                 <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 mb-3 tracking-tight">{settings?.companyName || 'Flux ERP'}</h1>
                 <div className="text-gray-500 dark:text-slate-400 text-sm space-y-1.5 font-medium">
                   <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {settings?.companyEmail}</p>
                   <p className="flex items-start gap-2 whitespace-pre-line"><MapPin className="w-3.5 h-3.5 mt-1" /> {settings?.companyAddress}</p>
                 </div>
              </div>
              <div className="text-left md:text-right">
                 <h2 className="text-5xl font-black text-gray-200 dark:text-slate-800 uppercase tracking-tighter mb-4">Invoice</h2>
                 <p className="text-2xl font-black text-gray-800 dark:text-slate-200">#{invoice.number}</p>
                 
                 {/* Status Badge */}
                 <div className="flex md:justify-end gap-2 mt-4">
                    <StatusBadge status={invoice.status} />
                 </div>
              </div>
          </div>

          {/* Bill To & Dates */}
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Bill To</h3>
              <div className="space-y-1.5">
                <p className="font-black text-xl text-gray-900 dark:text-slate-100">{client?.name}</p>
                <p className="text-gray-500 dark:text-slate-400 font-medium">{client?.email}</p>
                {client?.address && <p className="text-gray-500 dark:text-slate-400 mt-2 whitespace-pre-line text-sm leading-relaxed">{client.address}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
               <div>
                 <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Issued Date</h3>
                 <p className="font-bold text-gray-900 dark:text-slate-100">{new Date(invoice.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
               </div>
               <div>
                 <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Due Date</h3>
                 <p className={`font-black ${invoice.status === 'overdue' ? 'text-rose-600' : 'text-gray-900 dark:text-slate-100'}`}>
                    {new Date(invoice.expiredDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                 </p>
               </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-10 pb-10 overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4 rounded-l-2xl">Item & Description</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right rounded-r-2xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="group transition-colors">
                    <td className="px-6 py-6">
                      <p className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.itemName}</p>
                      {item.description && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{item.description}</p>}
                    </td>
                    <td className="px-6 py-6 text-center text-gray-600 dark:text-slate-400 font-bold">{item.quantity}</td>
                    <td className="px-6 py-6 text-right text-gray-600 dark:text-slate-400 font-bold">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-6 text-right font-black text-gray-900 dark:text-slate-100">
                      ${(item.quantity * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Totals */}
          <div className="p-10 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="flex-1 w-full">
               {invoice.notes && (
                 <div className="max-w-md">
                    <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Notes</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed italic">{invoice.notes}</p>
                 </div>
               )}
            </div>
            <div className="w-full md:w-80 space-y-4">
               <div className="flex justify-between text-gray-500 dark:text-slate-400 font-medium">
                 <span>Subtotal</span>
                 <span className="text-gray-900 dark:text-slate-200 font-bold">${invoice.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               {invoice.taxTotal > 0 && (
                 <div className="flex justify-between text-gray-500 dark:text-slate-400 font-medium">
                   <span>Tax ({invoice.taxRate}%)</span>
                   <span className="text-gray-900 dark:text-slate-200 font-bold">+${invoice.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
               )}
               {invoice.discount > 0 && (
                 <div className="flex justify-between text-gray-600">
                   <span>Discount</span>
                   <span>-${invoice.discount.toFixed(2)}</span>
                 </div>
               )}
               <div className="flex justify-between text-gray-900 dark:text-slate-100 font-bold text-xl pt-3 border-t border-gray-200 dark:border-slate-800">
                 <span>Total</span>
                 <span>${invoice.total.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium pt-2">
                 <span>Amount Paid</span>
                 <span>-${amountPaid.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-gray-900 dark:text-slate-100 font-black text-lg pt-2 border-t border-gray-200 dark:border-slate-800">
                 <span>Balance Due</span>
                 <span>${balanceDue.toFixed(2)}</span>
               </div>
            </div>
          </div>

        </div>
      </main>

      {/* --- PAYMENT MODAL --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 border border-transparent dark:border-slate-800">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-slate-100">Record Payment</h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>
                <form onSubmit={handlePayment} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Amount Received ($)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            max={balanceDue}
                            autoFocus
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full border-gray-300 dark:border-slate-700 border p-3 rounded-lg text-2xl font-bold text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Max allowed: ${balanceDue.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsPaymentModalOpen(false)} 
                            className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-black dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}
