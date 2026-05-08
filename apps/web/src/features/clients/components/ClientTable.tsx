import type { Client } from '../types';
import { ChevronLeft, ChevronRight, Edit, Trash2, Mail, Phone, MapPin, Link2, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { StatusBadge } from '../../../components/StatusBadge';
import { InlineEdit } from '../../../components/InlineEdit';

type Density = 'compact' | 'relaxed';

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  // Actions
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onInlineUpdate?: (id: string, data: Partial<Client>) => Promise<void>;
  onPortalLink: (id: string) => void;
  onAdd?: () => void;
  portalLoadingId?: string | null;
  density?: Density;
}

export function ClientTable({ 
  clients, loading, 
  page, totalPages, onPageChange,
  onEdit, onDelete,
  onInlineUpdate,
  onPortalLink,
  onAdd,
  portalLoadingId,
  density = 'relaxed'
}: ClientTableProps) {
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-12 flex justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
        <EmptyState 
            title="No clients yet"
            description="Add your first client to start creating invoices and managing your business relationships."
            icon={Users}
            actionLabel="Add First Client"
            onAction={onAdd}
            stepNumber={1}
            secondaryActionLabel="Need help?"
            onSecondaryAction={() => window.open('https://docs.example.com/clients', '_blank')}
        />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-100 dark:border-slate-800">
            <tr>
              <th className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === 'compact' ? 'py-3' : 'py-5'}`}>Name</th>
              <th className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === 'compact' ? 'py-3' : 'py-5'}`}>Contact</th>
              <th className={`px-6 text-xs uppercase tracking-wider font-semibold ${density === 'compact' ? 'py-3' : 'py-5'}`}>Address</th>
              <th className={`px-6 text-xs uppercase tracking-wider font-semibold text-center ${density === 'compact' ? 'py-3' : 'py-5'}`}>Status</th>
              <th className={`px-6 text-xs uppercase tracking-wider font-semibold text-right ${density === 'compact' ? 'py-3' : 'py-5'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {clients.map((client) => (
              <tr key={client._id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all group cursor-default">
                <td className={`px-6 ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                    <Link to={`/clients/${client._id}`} className="font-bold text-gray-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {client.name}
                    </Link>
                </td>
                <td className={`px-6 text-gray-600 dark:text-slate-400 text-sm ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                    <div className="flex items-center gap-2 mb-1 font-medium text-gray-900 dark:text-slate-200">
                        <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" /> {client.email}
                    </div>
                    {client.phoneNumber ? (
                        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-xs">
                            <Phone className="w-3 h-3" /> 
                            <div className="flex-1 min-w-[120px]">
                              <InlineEdit 
                                value={client.phoneNumber}
                                onSave={async (val) => {
                                  if (onInlineUpdate) await onInlineUpdate(client._id, { phoneNumber: String(val) });
                                }}
                              />
                            </div>
                        </div>
                    ) : (
                      <div className="text-gray-300 dark:text-slate-600 text-[10px] italic hover:text-gray-400 dark:hover:text-slate-400 cursor-pointer" onClick={() => onEdit(client)}>
                        + Add phone
                      </div>
                    )}
                </td>
                <td className={`px-6 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                    {client.address ? (
                        <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 flex-shrink-0" /> {client.address}
                        </span>
                    ) : '-'}
                </td>
                <td className={`px-6 text-center ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                    <StatusBadge status={client.status || 'active'} />
                </td>
                <td className={`px-6 text-right ${density === 'compact' ? 'py-2.5' : 'py-5'}`}>
                  <div className="flex justify-end gap-1">
	                    <button
	                      onClick={() => onPortalLink(client._id)}
                        title="Copy Portal Link"
	                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
	                    >
	                      {portalLoadingId === client._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
	                    </button>
                    <button 
                      onClick={() => onEdit(client)} 
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(client._id)} 
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/20 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-slate-400">
                Page <span className="font-medium text-gray-900 dark:text-slate-100">{page}</span> of <span className="font-medium text-gray-900 dark:text-slate-100">{totalPages}</span>
            </span>
            <div className="flex gap-2">
            <button
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            </button>
            <button
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            </button>
            </div>
        </div>
      )}
    </div>
  );
}
