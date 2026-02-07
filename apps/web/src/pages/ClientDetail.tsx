import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { ArrowLeft, Mail, Phone, MapPin, FileText, File, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Client } from '../features/clients/types';
import type { Invoice, Quote } from '@erp/types';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const getInvoicePrefix = (invoice: Invoice) =>
    (invoice as Invoice & { invoicePrefix?: string }).invoicePrefix ?? '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientRes, invoicesRes, quotesRes] = await Promise.all([
             api.get(`/clients/${id}`),
             api.get(`/invoices?clientId=${id}&limit=50`),
             api.get(`/quotes?clientId=${id}&limit=50`)
        ]);

        setClient(clientRes.data.data);
        setInvoices(invoicesRes.data.data);
        setQuotes(quotesRes.data.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load client details");
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate]);

  if (loading) return <div className="p-10 text-center flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  if (!client) return null;

  return (
      <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
        <main className="max-w-7xl mx-auto">
            <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Clients
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold shrink-0">
                            {client.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-gray-500 mt-2 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-4 h-4 text-gray-400" /> {client.email}
                                </div>
                                {client.phoneNumber && (
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="w-4 h-4 text-gray-400" /> {client.phoneNumber}
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-gray-400" /> {client.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                    
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Invoices */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" /> Invoices
                        </h2>
                        <button 
                            onClick={() => navigate(`/invoices/new?clientId=${client._id}`)} 
                            className="text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> New Invoice
                        </button>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Number</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No invoices found</td></tr>
                                ) : (
                                    invoices.map((inv: Invoice) => (
                                        <tr key={inv._id} className="hover:bg-gray-50 cursor-pointer transition group" onClick={() => navigate(`/invoices/${inv._id}`)}>
                                            <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {getInvoicePrefix(inv)}{inv.number}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {inv.date ? format(new Date(inv.date), 'MMM d, yyyy') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {inv.currency} {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                                                    inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    inv.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    inv.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
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

                {/* Quotes */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                         <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <File className="w-5 h-5 text-gray-400" /> Quotes
                        </h2>
                        <button 
                            onClick={() => navigate(`/quotes/new?clientId=${client._id}`)}
                            className="text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> New Quote
                        </button>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {quotes.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No quotes found</td></tr>
                                ) : (
                                    quotes.map(q => (
                                        <tr key={q._id} className="hover:bg-gray-50 cursor-pointer transition group" onClick={() => navigate(`/quotes/${q._id}`)}>
                                            <td className="px-6 py-4 font-medium text-gray-900 max-w-[150px] truncate group-hover:text-blue-600 transition-colors">
                                                {q.title || `Quote #${q.number}`}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {q.date ? format(new Date(q.date), 'MMM d, yyyy') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {q.currency} {q.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                                                    q.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    q.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                    {q.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
      </div>
  );
}
