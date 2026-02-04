import type { Client } from '../types';
import { ChevronLeft, ChevronRight, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  // ✅ Pagination Props
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  // Actions
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientTable({ 
  clients, loading, 
  page, totalPages, onPageChange,
  onEdit, onDelete 
}: ClientTableProps) {
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            No clients found.
        </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Address</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr key={client._id} className="hover:bg-gray-50 transition group">
                <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-3 h-3 text-gray-400" /> {client.email}
                    </div>
                    {client.phoneNumber && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Phone className="w-3 h-3 text-gray-400" /> {client.phoneNumber}
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {client.address ? (
                        <span className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-gray-400" /> {client.address}
                        </span>
                    ) : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        client.status === 'active' 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        {client.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(client)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(client._id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
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
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
            </span>
            <div className="flex gap-2">
            <button
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="p-2 border bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-2 border bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
                <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            </div>
        </div>
      )}
    </div>
  );
}