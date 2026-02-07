import { useNavigate } from 'react-router-dom';

interface InvoicePreview {
  _id: string;
  number: string;
  date: string;
  total: number;
  status: string;
  clientId?: { name: string };
}

export const RecentInvoices = ({ invoices }: { invoices: InvoicePreview[] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800">Recent Invoices</h3>
        <button onClick={() => navigate('/invoices')} className="text-sm font-semibold text-violet-600 hover:text-violet-700">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No recent invoices</td></tr>
            ) : (
              invoices.slice(0, 5).map((inv, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/invoices/${inv._id}/edit`)}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{inv.clientId?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">#{inv.number}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700 text-right">${inv.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                      inv.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};