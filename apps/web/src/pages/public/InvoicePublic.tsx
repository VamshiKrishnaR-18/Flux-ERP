import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/axios'; // Make sure this axios instance handles public URLs
import { format } from 'date-fns';
import { Printer, CreditCard, CheckCircle, X, Loader2, Lock } from 'lucide-react';
import type { Invoice, SettingsDTO } from '@erp/types';
import { toast } from 'sonner';

export default function InvoicePublic() {
  const { id } = useParams();
  const [data, setData] = useState<{ invoice: Invoice, settings: SettingsDTO } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment State
  const [showPayModal, setShowPayModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // We use the public endpoint we just created
        const res = await api.get(`/public/invoices/${id}`);
        setData(res.data.data);
      } catch {
        setError("This invoice does not exist or has been removed.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading Invoice...</div>;
  if (error || !data) return <div className="p-10 text-center text-red-500 font-bold">{error || "Data not found"}</div>;

  const { invoice, settings } = data;
  const client = invoice.clientId as unknown as { name: string, email: string, phoneNumber?: string, address?: string };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 2000));

    try {
        await api.post(`/public/invoices/${id}/pay`, {
            amount: invoice.total - (invoice.amountPaid || 0),
            method: 'Credit Card'
        });
        toast.success("Payment processed successfully!");
        setShowPayModal(false);
        // Reload data to show paid status
        const res = await api.get(`/public/invoices/${id}`);
        setData(res.data.data);
    } catch (err) {
        toast.error("Payment failed. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white text-gray-800 min-h-screen">
      {/* Top Bar for Actions */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center no-print sticky top-0 z-40 shadow-md">
        <div className="text-sm opacity-80 font-medium">Viewing as Client</div>
        <div className="flex items-center gap-3">
            {invoice.status !== 'paid' && (
                <button 
                    onClick={() => setShowPayModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-emerald-900/20"
                >
                    <CreditCard className="w-4 h-4" /> Pay Now
                </button>
            )}
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition">
                <Printer className="w-4 h-4" /> Print / PDF
            </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600" /> Secure Payment
                    </h3>
                    <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handlePayment} className="p-6 space-y-5">
                    <div className="text-center mb-6">
                        <p className="text-gray-500 text-sm mb-1">Total Amount Due</p>
                        <p className="text-3xl font-bold text-gray-900">${(invoice.total - (invoice.amountPaid || 0)).toFixed(2)}</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="4242 4242 4242 4242" 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                    defaultValue="4242 4242 4242 4242"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry</label>
                                <input 
                                    type="text" 
                                    placeholder="MM/YY" 
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-center"
                                    defaultValue="12/28"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVC</label>
                                <input 
                                    type="text" 
                                    placeholder="123" 
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-center"
                                    defaultValue="123"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cardholder Name</label>
                            <input 
                                type="text" 
                                placeholder="John Doe" 
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                defaultValue="John Doe"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isProcessing}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        {isProcessing ? 'Processing...' : 'Pay Now'}
                    </button>
                    
                    <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Payments are secure and encrypted
                    </p>
                </form>
            </div>
        </div>
      )}

      <div className="p-12 print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">{settings?.companyName || 'Company Name'}</h1>
                <div className="text-gray-500 text-sm space-y-1">
                    <p>{settings?.companyAddress}</p>
                    <p>{settings?.companyEmail}</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-bold text-gray-200 uppercase tracking-widest">Invoice</h2>
                <p className="text-xl font-semibold mt-2 text-slate-700">#{invoice.number}</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase">
                    {invoice.status}
                </div>
            </div>
        </div>

        {/* Addresses */}
        <div className="flex justify-between mb-12">
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
                <p className="font-bold text-lg text-slate-900">{client?.name}</p>
                <p className="text-gray-500">{client?.email}</p>
                <p className="text-gray-500">{client?.phoneNumber}</p>
                <p className="text-gray-500 whitespace-pre-line">{client?.address}</p>
            </div>
            <div className="text-right space-y-2">
                <div>
                    <span className="text-gray-500 text-sm mr-4">Date Issued:</span>
                    <span className="font-medium">{format(new Date(invoice.date), 'MMM dd, yyyy')}</span>
                </div>
                <div>
                    <span className="text-gray-500 text-sm mr-4">Due Date:</span>
                    <span className="font-medium">{format(new Date(invoice.expiredDate), 'MMM dd, yyyy')}</span>
                </div>
            </div>
        </div>

        {/* Table */}
        <table className="w-full mb-12">
            <thead className="bg-slate-50 border-y border-slate-200">
                <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item, i: number) => (
                    <tr key={i}>
                        <td className="py-4 px-4">
                            <p className="font-medium text-slate-900">{item.itemName}</p>
                            <p className="text-sm text-gray-500">{item.description}</p>
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-gray-600">${item.price.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right font-medium text-slate-900">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end border-t border-gray-100 pt-6">
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
                     <div className="flex justify-between text-red-500">
                        <span>Discount</span>
                        <span>-${invoice.discount.toFixed(2)}</span>
                    </div>
                )}
                 <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-gray-200">
                    <span>Total Due</span>
                    <span>${invoice.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        {/* Footer Notes */}
        {invoice.notes && (
             <div className="mt-12 pt-6 border-t border-gray-100 text-gray-500 text-sm">
                <h4 className="font-bold text-gray-400 text-xs uppercase mb-2">Notes</h4>
                <p>{invoice.notes}</p>
            </div>
        )}
      </div>
    </div>
  );
}