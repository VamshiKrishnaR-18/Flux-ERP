import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/axios';
import { ExternalLink, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (!token) {
      setError('Invalid portal link');
      setLoading(false);
      return;
    }

    const run = async () => {
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
    run();
  }, [token]);

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
    <div className="bg-white text-gray-800">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="text-sm opacity-80">Client Portal (Read-only)</div>
        <div className="text-xs opacity-70">{settings?.companyName || 'Company'}</div>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{client?.name}</h1>
          <div className="text-sm text-gray-600 mt-1">
            <div>{client?.email}</div>
            {client?.phoneNumber ? <div>{client.phoneNumber}</div> : null}
            {client?.address ? <div className="whitespace-pre-line">{client.address}</div> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b font-semibold">Invoices</div>
            {invoices.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No invoices available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-500 border-b">
                    <tr>
                      <th className="px-4 py-3">Number</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((inv: Invoice) => (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">#{inv.number}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-right font-medium">{money(inv.total, inv.currency)}</td>
                        <td className="px-4 py-3 text-gray-600">{String(inv.status || '').toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Link to={`/p/invoice/${inv._id}`} className="p-2 rounded-lg hover:bg-gray-100" title="Open invoice">
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

          <section className="border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b font-semibold">Quotes</div>
            {quotes.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No quotes available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-500 border-b">
                    <tr>
                      <th className="px-4 py-3">Number</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quotes.map((q: Quote) => (
                      <tr key={q._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">#{q.number}</td>
                        <td className="px-4 py-3 text-gray-700">{q.title || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium">{money(q.total, q.currency)}</td>
                        <td className="px-4 py-3 text-gray-600">{String(q.status || '').toUpperCase()}</td>
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
  );
}

