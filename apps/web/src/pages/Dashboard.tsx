import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/Navbar';
import { ClientFilters } from '../features/clients/ClientFilters';
import { ClientTable } from '../features/clients/ClientTable';
import { ClientModal } from '../features/clients/ClientModal';
import type { Client } from '../features/clients/types';
import { toast } from 'sonner';



export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Fetch Data
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await axios.delete(`http://localhost:3000/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(clients.filter(c => c._id !== id));
      toast.success("Client deleted successfully");
    } catch (err) {
      toast.error("Failed to delete client");
    }
  };

  const handleSaveClient = async (formData: any) => {

    const toastId = toast.loading("Saving client...");

    try {
      if (editingClient) {
        await axios.put(`http://localhost:3000/clients/${editingClient._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:3000/clients', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchClients();
      setIsModalOpen(false);

      toast.success(editingClient ? "Client updated!" : "Client created!", {
        id: toastId,
      });

    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed", {
        id: toastId,
      });
    }
  };

  // Logic: Filter Clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase()) || 
                          client.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar userName={user.name || 'User'} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-gray-500">Manage your customer relationships</p>
          </div>
          <button 
            onClick={() => { setEditingClient(null); setIsModalOpen(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition"
          >
            + New Client
          </button>
        </div>

        <ClientFilters 
          search={search} 
          setSearch={setSearch} 
          statusFilter={statusFilter} 
          setStatusFilter={setStatusFilter} 
        />

        <ClientTable 
          clients={filteredClients} 
          loading={loading} 
          error={error} 
          onEdit={(client) => { setEditingClient(client); setIsModalOpen(true); }} 
          onDelete={handleDelete} 
        />
      </main>

      <ClientModal 
        isOpen={isModalOpen} 
        editingClient={editingClient} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient} 
      />
    </div>
  );
}