import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/axios'; // Make sure this axios instance handles public URLs
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

export default function InvoicePublic() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // We use the public endpoint we just created
        const res = await api.get(`/public/invoices/${id}`);
        setData(res.data.data);
      } catch (err) {
        setError("This invoice does not exist or has been removed.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading Invoice...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

  const { invoice, settings } = data;
  const client = invoice.clientId;

  return (
    <div className="bg-white text-gray-800">
      {/* Top Bar for Actions */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center no-print">
        <div className="text-sm opacity-80">Viewing as Client</div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium transition">
           <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

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
                <p className="text-gray-500">{client?.phone}</p>
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
                {invoice.items.map((item: any, i: number) => (
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