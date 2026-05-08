import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/axios';
import { ExternalLink, Loader2, Download, Check, X } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '../../features/invoices/components/InvoicePDF';
import { QuotePDF } from '../../features/quotes/components/QuotePDF';
import { toast } from 'sonner';
import type { Client, Invoice, Quote, SettingsDTO } from '@erp/types';

type PortalPayload = { client: Client; settings?: SettingsDTO; invoices: Invoice[]; quotes: Quote[] };

const money = (value: unknown, currency?: unknown) => {
  const cur = typeof currency === 'string' && currency ? currency : 'USD';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(Number(value ?? 0));
};

export default function ClientPortalPublic() {
  const { token } = useParams();
  const [payload, setPayload] = useState<PortalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/public/portal/${token}`);
      setPayload(res.data.data);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'This portal link is invalid or has been disabled.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleQuoteAction = async (quoteId: string, action: 'approve' | 'reject') => {
    setActionLoading(quoteId);
    try {
      await api.post(`/public/quotes/${quoteId}/${action}`);
      toast.success(`Quote ${action}d successfully`);
      await fetchData();
    } catch {
      toast.error(`Failed to ${action} quote`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading portal...
      </div>
    );
  }
  if (error) return <div className="p-10 text-center text-red-600 font-semibold">{error}</div>;

  const client = payload?.client;
  const settings = payload?.settings;
  const invoices = payload?.invoices ?? [];
  const quotes = payload?.quotes ?? [];

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-lg">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-60 font-bold mb-1">Client Portal</div>
          <div className="text-xl font-bold">{settings?.companyName || 'Company'}</div>
        </div>
        <div className="text-right hidden sm:block">
           <div className="text-sm font-medium">{client?.name}</div>
           <div className="text-xs opacity-60">{client?.email}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Client Info */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Contact Name</div>
                    <div className="font-semibold text-gray-900">{client?.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Email Address</div>
                    <div className="font-semibold text-gray-900">{client?.email}</div>
                  </div>
                  {client?.phoneNumber && (
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Phone</div>
                      <div className="font-semibold text-gray-900">{client.phoneNumber}</div>
                    </div>
                  )}
                  {client?.address && (
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Address</div>
                      <div className="font-semibold text-gray-900 whitespace-pre-line">{client.address}</div>
                    </div>
                  )}
                </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-md">
                <h2 className="text-sm font-bold opacity-80 uppercase tracking-wider mb-2">Total Outstanding</h2>
                <div className="text-3xl font-bold">
                  {money(invoices.reduce((sum, inv) => inv.status !== 'paid' ? sum + (inv.total - (inv.amountPaid ?? 0)) : sum, 0))}
                </div>
                <p className="text-xs opacity-70 mt-2">Across all unpaid invoices</p>
            </div>
          </div>

          {/* Right Column: Tables */}
          <div className="xl:col-span-2 space-y-8">
            {/* Invoices Table */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/50 border-b flex justify-between items-center">
                <h2 className="font-bold text-gray-900">Invoices History</h2>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{invoices.length}</span>
              </div>
              {invoices.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic">No invoices found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-gray-400 font-bold border-b bg-gray-50/30">
                      <tr>
                        <th className="px-6 py-4">Invoice</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.map((inv: Invoice) => (
                        <tr key={inv._id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">#{inv.number}</div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold">{inv.year}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {inv.date ? new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-bold text-gray-900">{money(inv.total, inv.currency)}</div>
                            {(inv.amountPaid ?? 0) > 0 && inv.status !== 'paid' && (
                              <div className="text-[10px] text-emerald-600 font-bold">Paid: {money(inv.amountPaid, inv.currency)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                              ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                inv.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                                'bg-blue-50 text-blue-700 border-blue-100'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <PDFDownloadLink
                                document={<InvoicePDF invoice={inv} settings={settings ?? undefined} />}
                                fileName={`invoice-${inv.number}.pdf`}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Download PDF"
                              >
                                {({ loading }) => loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                              </PDFDownloadLink>
                              <Link to={`/p/invoice/${inv._id}`} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all" title="View Details">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Quotes Table */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/50 border-b flex justify-between items-center">
                <h2 className="font-bold text-gray-900">Estimates & Quotes</h2>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{quotes.length}</span>
              </div>
              {quotes.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic">No quotes found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-gray-400 font-bold border-b bg-gray-50/30">
                      <tr>
                        <th className="px-6 py-4">Quote</th>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4 text-right">Estimate</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quotes.map((q: Quote) => (
                        <tr key={q._id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-gray-900">#{q.number}</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{q.title || '-'}</td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">{money(q.total, q.currency)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                              ${q.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                q.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                                'bg-amber-50 text-amber-700 border-amber-100'}`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                               {q.status === 'sent' && (
                                 <>
                                   <button 
                                      onClick={() => handleQuoteAction(q._id, 'approve')}
                                      disabled={actionLoading === q._id}
                                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                      title="Approve Quote"
                                   >
                                      {actionLoading === q._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                   </button>
                                   <button 
                                      onClick={() => handleQuoteAction(q._id, 'reject')}
                                      disabled={actionLoading === q._id}
                                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                      title="Reject Quote"
                                   >
                                      {actionLoading === q._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                   </button>
                                 </>
                               )}
                               <PDFDownloadLink
                                document={<QuotePDF quote={q} settings={settings ?? undefined} />}
                                fileName={`quote-${q.number}.pdf`}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Download PDF"
                              >
                                {({ loading }) => loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                              </PDFDownloadLink>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

