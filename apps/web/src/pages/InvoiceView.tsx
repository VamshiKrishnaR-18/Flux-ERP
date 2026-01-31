import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { InvoicePDF } from '../components/InvoicePDF';
import { PDFDownloadLink } from '@react-pdf/renderer';
// ✅ Import CreditCard and X icons
import { ArrowLeft, Printer, Pencil, Download, CreditCard, X } from 'lucide-react';
import type { Invoice } from '@erp/types';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoiceRes, settingsRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get('/settings')
        ]);
        setInvoice(invoiceRes.data.data);
        setSettings(settingsRes.data.data);
      } catch (error) {
        toast.error("Failed to load invoice");
        navigate('/invoices');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) loadData();
  }, [id, navigate]);

  // ✅ Handle Payment Submission
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
        // Reload page to see status change
        window.location.reload();
    } catch (error) {
        toast.error("Failed to record payment");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading || !invoice) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  const client = invoice.clientId as any;
  // Calculate Balance
  const amountPaid = invoice.amountPaid || 0;
  const balanceDue = invoice.total - amountPaid;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <main className="max-w-4xl mx-auto">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/invoices')} className="text-gray-500 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          
          <div className="flex gap-3">
             {/* ✅ Record Payment Button (Only if not fully paid) */}
             {invoice.status !== 'paid' && (
                <button 
                    onClick={() => {
                        setPaymentAmount(balanceDue.toFixed(2)); // Auto-fill balance
                        setIsPaymentModalOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
                >
                    <CreditCard className="w-4 h-4" /> Record Payment
                </button>
             )}

            <button 
              onClick={() => navigate(`/invoices/${id}/edit`)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoice} settings={settings} />}
              fileName={`invoice-${invoice.number}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
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

        {/* Invoice Paper UI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          
          {/* ✅ PAID Stamp */}
          {invoice.status === 'paid' && (
            <div className="absolute top-10 right-10 transform rotate-12 border-4 border-green-500 text-green-500 text-5xl font-black px-4 py-2 rounded opacity-50 select-none pointer-events-none">
                PAID
            </div>
          )}

          {/* ... Top Banner ... */}
          <div className="p-8 border-b border-gray-100 flex justify-between items-start">
             <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{settings?.companyName || 'Your Company'}</h1>
                <div className="text-gray-500 text-sm space-y-1">
                  <p>{settings?.companyEmail}</p>
                  <p className="whitespace-pre-line">{settings?.companyAddress}</p>
                </div>
             </div>
             <div className="text-right">
                <h2 className="text-4xl font-extrabold text-gray-100 uppercase tracking-widest mb-2">Invoice</h2>
                <p className="text-lg font-bold text-gray-700">#{invoice.number}</p>
                <div className="flex justify-end gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 
                    invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {invoice.status}
                    </span>
                </div>
             </div>
          </div>

          <div className="p-8 grid grid-cols-2 gap-12">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
              <div className="text-gray-800">
                <p className="font-bold text-lg">{client?.name}</p>
                <p className="text-gray-500">{client?.email}</p>
                {client?.address && <p className="text-gray-500 mt-1">{client.address}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div>
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Issued Date</h3>
                 <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
               </div>
               <div>
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Due Date</h3>
                 <p className={`font-medium ${invoice.status === 'overdue' ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                    {new Date(invoice.expiredDate).toLocaleDateString()}
                 </p>
               </div>
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
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{item.itemName}</p>
                    </td>
                    <td className="px-4 py-4 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-gray-600">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Totals */}
          <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
            <div className="w-64 space-y-3">
               <div className="flex justify-between text-gray-600">
                 <span>Subtotal</span>
                 <span>${invoice.subTotal.toFixed(2)}</span>
               </div>
               {invoice.taxTotal > 0 && (
                 <div className="flex justify-between text-gray-600">
                   <span>Tax ({invoice.taxRate}%)</span>
                   <span>+${invoice.taxTotal.toFixed(2)}</span>
                 </div>
               )}
               {invoice.discount > 0 && (
                 <div className="flex justify-between text-gray-600">
                   <span>Discount</span>
                   <span>-${invoice.discount.toFixed(2)}</span>
                 </div>
               )}
               <div className="flex justify-between text-gray-900 font-bold text-xl pt-3 border-t border-gray-200">
                 <span>Total</span>
                 <span>${invoice.total.toFixed(2)}</span>
               </div>
               
               {/* ✅ Amount Paid & Balance Due */}
               <div className="flex justify-between text-emerald-600 font-medium pt-2">
                 <span>Amount Paid</span>
                 <span>-${amountPaid.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-gray-900 font-black text-lg pt-2 border-t border-gray-200">
                 <span>Balance Due</span>
                 <span>${balanceDue.toFixed(2)}</span>
               </div>
            </div>
          </div>

        </div>
      </main>

      {/* ✅ Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Record Payment</h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handlePayment} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            autoFocus
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full border p-3 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Confirm Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}