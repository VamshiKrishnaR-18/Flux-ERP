import { useState } from 'react';
import { Search, Filter, UserPlus } from 'lucide-react';
import { useClients } from '../features/clients/hooks/useClients';
import { ClientTable } from '../features/clients/components/ClientTable';
import { ClientModal } from '../features/clients/components/ClientModal';
import { TableSkeleton } from '../components/Skeleton';

type Density = 'compact' | 'relaxed';

export default function Clients() {
  const [density, setDensity] = useState<Density>('relaxed');
  const { 
    clients, 
    loading, 
    search, 
    setSearch, 
    page, 
    setPage, 
    totalPages, 
    updateClient, 
    deleteClient, 
    generatePortalLink, 
    portalLoadingId 
  } = useClients();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/30 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Clients</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Manage your customer relationships</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1 shadow-sm transition-colors">
              <button
                onClick={() => setDensity('compact')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${density === 'compact' ? 'bg-black dark:bg-slate-100 text-white dark:text-slate-900' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                Compact
              </button>
              <button
                onClick={() => setDensity('relaxed')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${density === 'relaxed' ? 'bg-black dark:bg-slate-100 text-white dark:text-slate-900' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                Relaxed
              </button>
            </div>
            <button
              onClick={() => {
                setEditingClient(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-sm font-semibold text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input 
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-slate-600 transition-all outline-none text-sm shadow-sm text-gray-900 dark:text-slate-100"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 transition-all text-sm font-medium shadow-sm">
                <Filter className="w-4 h-4" />
                Filter
            </button>
        </div>

        {loading ? (
          <TableSkeleton cols={5} rows={8} />
        ) : (
          <ClientTable 
            clients={clients} 
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onEdit={(client) => {
              setEditingClient(client);
              setIsModalOpen(true);
            }}
            onDelete={(id) => deleteClient(id)}
            onInlineUpdate={async (id, data) => {
               updateClient(id, data);
            }}
            onPortalLink={generatePortalLink}
            onAdd={() => setIsModalOpen(true)}
            portalLoadingId={portalLoadingId}
            density={density}
          />
        )}

        <ClientModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }}
          client={editingClient}
        />
    </div>
  );
}
