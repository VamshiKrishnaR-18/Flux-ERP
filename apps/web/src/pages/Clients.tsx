import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { Search, User, Plus, Download, Loader2 } from 'lucide-react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { useDebounce } from '../hooks/useDebounce'; 
import { ClientTable } from '../features/clients/components/ClientTable';
import { ClientModal } from '../features/clients/components/ClientModal';
import type { Client } from '../features/clients/types';

const clientListStyles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, color: '#111', fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottom: '1px solid #F3F4F6' },
  colName: { width: '30%' },
  colEmail: { width: '30%' },
  colPhone: { width: '20%' },
  colStatus: { width: '20%' }
});

const ClientListPDF = ({ clients }: { clients: Client[] }) => (
  <Document>
    <Page size="A4" style={clientListStyles.page}>
      <Text style={clientListStyles.title}>Clients</Text>
      <View style={clientListStyles.tableHeader}>
        <Text style={clientListStyles.colName}>Name</Text>
        <Text style={clientListStyles.colEmail}>Email</Text>
        <Text style={clientListStyles.colPhone}>Phone</Text>
        <Text style={clientListStyles.colStatus}>Status</Text>
      </View>
      {clients.map((client) => (
        <View key={client._id} style={clientListStyles.row}>
          <Text style={clientListStyles.colName}>{client.name}</Text>
          <Text style={clientListStyles.colEmail}>{client.email}</Text>
          <Text style={clientListStyles.colPhone}>{client.phoneNumber || '-'}</Text>
          <Text style={clientListStyles.colStatus}>{client.status}</Text>
        </View>
      ))}
    </Page>
  </Document>
);

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [portalLoadingId, setPortalLoadingId] = useState<string | null>(null);
  
  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  
  const debouncedSearch = useDebounce(search, 500);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
        
        const url = `/clients?page=${page}&limit=10&search=${debouncedSearch}`;
        const { data } = await api.get(url);
        
        setClients(data.data || []);
        if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
        }
    } catch {
        toast.error("Failed to load clients");
    } finally {
        setIsLoading(false);
    }
  }, [page, debouncedSearch]);

 
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
        await api.delete(`/clients/${id}`);
        toast.success("Client deleted");
        fetchClients();
    } catch {
        toast.error("Delete failed");
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await api.get(`/clients/export/csv${qs}`, { responseType: 'blob' });

      const disposition = (res.headers?.['content-disposition'] as string | undefined) ?? '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const fallback = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
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
      const qs = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await api.get(`/clients?page=1&limit=10000${qs}`);
      const allClients = res.data.data as Client[];
      const blob = await pdf(<ClientListPDF clients={allClients} />).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-${new Date().toISOString().slice(0, 10)}.pdf`;
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

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
  };

  const handlePortalLink = async (id: string) => {
    setPortalLoadingId(id);
    try {
      const res = await api.post(`/clients/${id}/portal-token`);
      const token = res.data?.data?.token as string | undefined;
      if (!token) throw new Error('No token returned');

      const url = `${window.location.origin}/portal/${token}`;
      await copyToClipboard(url);
      toast.success('Portal link copied to clipboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to generate portal link');
    } finally {
      setPortalLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <main className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-gray-700" /> Clients
                </h1>
                <p className="text-gray-500 text-sm mt-1">Manage your customer database</p>
            </div>
            
            <div className="flex w-full sm:w-auto gap-3">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search clients..." 
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm transition-all"
                    />
                </div>

                <button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm whitespace-nowrap disabled:opacity-60"
                >
                    {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export PDF
                </button>
                <button
                    onClick={handleExportCsv}
                    disabled={isExporting}
                    className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm whitespace-nowrap disabled:opacity-60"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export CSV
                </button>
                <button 
                    onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
                    className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Add Client
                </button>
            </div>
        </div>

        {/* Client Table with Pagination */}
        <ClientTable 
            clients={clients}
            loading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onEdit={(client) => { setEditingClient(client); setIsModalOpen(true); }}
            onDelete={handleDelete}
	            onPortalLink={handlePortalLink}
	            portalLoadingId={portalLoadingId}
            onAdd={() => setIsModalOpen(true)}
        />

        <ClientModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => { fetchClients(); setIsModalOpen(false); }}
            client={editingClient}
        />

      </main>
    </div>
  );
}
