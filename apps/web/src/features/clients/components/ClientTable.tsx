import type { Client } from './types';

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  error: string;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientTable({ clients, loading, error, onEdit, onDelete }: ClientTableProps) {
  if (loading) return <div className="p-8 text-center text-gray-500">Loading clients...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (clients.length === 0) return <div className="p-12 text-center text-gray-500">No clients found.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr key={client._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                <td className="px-6 py-4">
                  <div className="text-gray-900">{client.email}</div>
                  <div className="text-xs text-gray-500">{client.phoneNumber}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    client.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {client.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => onEdit(client)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                  <button onClick={() => onDelete(client._id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}