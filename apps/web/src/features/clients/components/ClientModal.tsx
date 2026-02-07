import { useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form'; // ✅ Added types
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientSchema, type ClientDTO } from '@erp/types';
import { api } from '../../../lib/axios';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Client } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client | null;
}

export function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors, isSubmitting } 
  } = useForm<ClientDTO>({
    // ✅ Fix 1: Cast resolver to handle Zod 'default' value mismatches
    resolver: zodResolver(ClientSchema) as Resolver<ClientDTO>, 
    defaultValues: {
      status: 'active',
      removed: false
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (client) {
        setValue('name', client.name);
        setValue('email', client.email);
        setValue('phoneNumber', client.phoneNumber || '');
        setValue('address', client.address || '');
      } else {
        reset({ name: '', email: '', phoneNumber: '', address: '' });
      }
    }
  }, [isOpen, client, reset, setValue]);

  // ✅ Fix 2: Use SubmitHandler type to match handleSubmit expectation
  const onSubmit: SubmitHandler<ClientDTO> = async (data) => {
    try {
      if (client) {
        await api.put(`/clients/${client._id}`, data);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', data);
        toast.success('Client created successfully');
      }
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              {...register('name')} 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Company or Name" 
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                {...register('email')} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="name@company.com" 
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input 
                {...register('phoneNumber')} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="+1..." 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea 
              {...register('address')} 
              rows={3} 
              className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="1234 Main St..." 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
              {client ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}