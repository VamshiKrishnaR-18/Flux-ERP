import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientSchema, type ClientDTO, type Client } from '@erp/types'; // ✅ Fixed Import
import { X, Loader2 } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientDTO) => Promise<void>;
  initialData?: Client | null;
  isLoading?: boolean;
}

export function ClientModal({ isOpen, onClose, onSubmit, initialData, isLoading }: ClientModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientDTO>({
    resolver: zodResolver(ClientSchema) as Resolver<ClientDTO>, // ✅ Fixed Resolver Type
    // ✅ Fixed: 'phone' -> 'phoneNumber' to match Schema
    defaultValues: { name: '', email: '', phoneNumber: '', address: '', status: 'active' }
  });

  useEffect(() => {
    if (isOpen) {
        reset(initialData || { name: '', email: '', phoneNumber: '', address: '', status: 'active' });
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">{initialData ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Company / Name</label>
            <input {...register('name')} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" autoFocus />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                <input {...register('email')} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
                {/* ✅ Fixed: phoneNumber */}
                <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
                <input {...register('phoneNumber')} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
            <textarea {...register('address')} rows={3} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium transition flex items-center gap-2">
              {isLoading && <Loader2 className="animate-spin w-4 h-4"/>}
              {isLoading ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}