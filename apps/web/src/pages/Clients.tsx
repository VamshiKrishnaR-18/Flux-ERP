import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { Search, ArrowUpDown, Trash2, Phone, Mail, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useSortableData } from '../hooks/useSortableData'; 

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  // ✅ Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  // 1️⃣ SEARCH (Filters the currently fetched page)
  const { query, setQuery, filteredItems: filteredClients } = useSearch(clients, ['name', 'email']);

  // 2️⃣ SORT (Sorts the currently fetched page)
  const { items: sortedClients, requestSort, sortConfig } = useSortableData(filteredClients);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortConfig.direction === 'ascending' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  // ✅ Updated Fetch Logic
  const fetchClients = async () => {
    setIsLoading(true);
    try {
        // Pass page and limit to Backend
        const res = await api.get(`/clients?page=${page}&limit=${LIMIT}`);
        
        // Handle response structure
        const data = res.data.data || [];
        const pagination = res.data.pagination || { totalPages: 1 };
        
        setClients(data);
        setTotalPages(pagination.totalPages);
    } catch (err) {
        toast.error("Failed to load clients");
    } finally {
        setIsLoading(false);
    }
  };
  
  // Re-fetch when page changes
  useEffect(() => { fetchClients(); }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      fetchClients(); // Refresh list to show new item
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      toast.success('Client added successfully');
    } catch (error) {
      toast.error('Failed to create client');
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this client?")) return;
    try {
        await api.delete(`/clients/${id}`);
        // Optimistic update (remove from UI immediately)
        setClients(prev => prev.filter(c => c._id !== id));
        toast.success("Client deleted");
        
        // If page becomes empty, go back one page
        if (clients.length === 1 && page > 1) {
            setPage(prev => prev - 1);
        } else {
            fetchClients(); // Sync with server
        }
    } catch (err) {
        toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6" /> Clients
        </h1>
        
        <div className="flex items-center gap-3">
             <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search visible clients..." 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>

            <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition whitespace-nowrap"
            >
                + Add Client
            </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No clients found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold cursor-pointer select-none">
                  <tr>
                    <th className="px-6 py-4 hover:bg-gray-100" onClick={() => requestSort('name')}>
                      Name <SortIcon column="name" />
                    </th>
                    <th className="px-6 py-4 hover:bg-gray-100" onClick={() => requestSort('email')}>
                      Contact Info <SortIcon column="email" />
                    </th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedClients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{client.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                              <Mail className="w-3 h-3 text-gray-400" /> {client.email}
                          </div>
                          {client.phone && (
                              <div className="flex items-center gap-2 text-gray-500">
                                  <Phone className="w-3 h-3 text-gray-400" /> {client.phone}
                              </div>
                          )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                          {client.address ? (
                              <div className="flex items-start gap-2">
                                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5" /> 
                                  <span className="max-w-[200px] truncate">{client.address}</span>
                              </div>
                          ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(client._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedClients.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No clients match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ Pagination Controls */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} 
                  className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Client</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company / Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="contact@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="123 Business St..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}