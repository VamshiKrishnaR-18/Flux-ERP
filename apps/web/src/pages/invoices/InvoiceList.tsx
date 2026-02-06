import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { Plus, FileText, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { toast } from 'sonner';

import { type Invoice } from '@erp/types';
import { EmptyState } from '../../components/EmptyState'; // ✅ Import

const invoiceListStyles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, color: '#111', fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottom: '1px solid #F3F4F6' },
  colNumber: { width: '18%' },
  colClient: { width: '32%' },
  colDate: { width: '16%' },
  colStatus: { width: '14%' },
  colTotal: { width: '20%', textAlign: 'right' }
});

const InvoiceListPDF = ({ invoices, currencySymbol }: { invoices: Invoice[]; currencySymbol: string }) => (
  <Document>
    <Page size="A4" style={invoiceListStyles.page}>
      <Text style={invoiceListStyles.title}>Invoices</Text>
      <View style={invoiceListStyles.tableHeader}>
        <Text style={invoiceListStyles.colNumber}>Number</Text>
        <Text style={invoiceListStyles.colClient}>Client</Text>
        <Text style={invoiceListStyles.colDate}>Date</Text>
        <Text style={invoiceListStyles.colStatus}>Status</Text>
        <Text style={invoiceListStyles.colTotal}>Total</Text>
      </View>
      {invoices.map((inv) => {
        const client = inv.clientId as unknown as { name?: string };
        const number = `${(inv as unknown as { invoicePrefix?: string }).invoicePrefix ?? ''}${inv.number ?? ''}`;
        return (
          <View key={inv._id} style={invoiceListStyles.row}>
            <Text style={invoiceListStyles.colNumber}>{number}</Text>
            <Text style={invoiceListStyles.colClient}>{client?.name || 'Unknown Client'}</Text>
            <Text style={invoiceListStyles.colDate}>{new Date(inv.date).toLocaleDateString()}</Text>
            <Text style={invoiceListStyles.colStatus}>{inv.status}</Text>
            <Text style={invoiceListStyles.colTotal}>{currencySymbol}{inv.total.toFixed(2)}</Text>
          </View>
        );
      })}
    </Page>
  </Document>
);

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // 1. Load Settings for Currency
    api.get('/settings').then(res => {
       const curr = res.data.data?.currency;
       if (curr === 'EUR') setCurrencySymbol('€');
       else if (curr === 'GBP') setCurrencySymbol('£');
       else if (curr === 'INR') setCurrencySymbol('₹');
       else setCurrencySymbol('$');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // 2. Fetch Invoices with Pagination
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/invoices?page=${page}&limit=10`); // limit=10 for better UI fit
        setInvoices(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      } catch {
        toast.error("Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/invoices/export/csv', { responseType: 'blob' });
      const disposition = (res.headers?.['content-disposition'] as string | undefined) ?? '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const fallback = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      const filename = match?.[1] ?? fallback;

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('CSV exported');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await api.get('/invoices?limit=10000');
      const allInvoices = res.data.data as Invoice[];
      const blob = await pdf(<InvoiceListPDF invoices={allInvoices} currencySymbol={currencySymbol} />).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <main className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invoices</h1>
            <p className="text-gray-500 mt-1">Manage and track your client billings</p>
          </div>
	      <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-60 w-full sm:w-auto"
          >
            {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
	        <button
	          onClick={handleExportCsv}
	          disabled={isExporting}
	          className="bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-60 w-full sm:w-auto"
	        >
	          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
	          Export CSV
	        </button>
	        <button 
	          onClick={() => navigate('/invoices/new')} 
	          className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto"
	        >
	          <Plus className="w-5 h-5" /> New Invoice
	        </button>
	      </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState 
            title="No invoices yet"
            description="Create your first invoice to get started."
            icon={FileText}
            actionLabel="Create Invoice"
            onAction={() => navigate('/invoices/new')}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Number</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => {
                    const client = inv.clientId as unknown as { name: string };
                    return (
                      <tr 
                        key={inv._id} 
                        onClick={() => navigate(`/invoices/${inv._id}`)}
                        className="group hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {inv.number}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">
                          {client?.name || <span className="text-gray-400 italic">Unknown Client</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(inv.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(inv.expiredDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                            ${inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 
                              inv.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              inv.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          {currencySymbol} {inv.total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-sm text-gray-500">
                    Page <span className="font-medium text-gray-900">{page}</span> of {totalPages}
                </span>
                <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all bg-white shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all bg-white shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
