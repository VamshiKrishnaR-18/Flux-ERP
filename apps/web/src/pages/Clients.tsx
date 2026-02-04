import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { Search, User, Plus } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce'; // ✅ Helper hook
import { ClientTable } from '../features/clients/components/ClientTable';
import { ClientModal } from '../features/clients/components/ClientModal';
import type { Client } from '../features/clients/types';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // ⏳ Debounce Search: Wait 500ms after typing stops before calling API
  const debouncedSearch = useDebounce(search, 500);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
        // ✅ FIX: Pass 'search' to backend
        const url = `/clients?page=${page}&limit=10&search=${debouncedSearch}`;
        const { data } = await api.get(url);
        
        setClients(data.data || []);
        if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
        }
    } catch (err) {
        toast.error("Failed to load clients");
    } finally {
        setIsLoading(false);
    }
  };

  // Trigger fetch when Page OR Search changes
  useEffect(() => {
    fetchClients();
  }, [page, debouncedSearch]);

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
                            setPage(1); // Reset to page 1 on new search
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                    />
                </div>
                <button 
                    onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
                    className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Add Client
                </button>
            </div>
        </div>

        {/* ✅ Usage of clean Table Component */}
        <ClientTable 
            clients={clients}
            loading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onEdit={(client) => { setEditingClient(client); setIsModalOpen(true); }}
            onDelete={handleDelete}
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