import { useEffect, useRef } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientSchema, type ClientDTO } from '@erp/types';
import { api } from '../../../lib/axios';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Client } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client | null;
}

export function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const queryClient = useQueryClient();
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors, isSubmitting } 
  } = useForm<ClientDTO>({
    resolver: zodResolver(ClientSchema) as Resolver<ClientDTO>, 
    defaultValues: {
      status: 'active',
      removed: false
    }
  });

  const { ref: nameRef, ...nameRegister } = register('name');

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
      
      // Accessibility: Focus first input
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, client, reset, setValue]);

  // Accessibility: Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

 
  const onSubmit: SubmitHandler<ClientDTO> = async (data) => {
    try {
      if (client) {
        await api.put(`/clients/${client._id}`, data);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', data);
        toast.success('Client created successfully');
      }
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 border border-transparent dark:border-slate-800"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-slate-100">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label>
            <input 
              {...nameRegister}
              id="client-name"
              ref={(e) => {
                nameRef(e);
                // @ts-ignore
                firstInputRef.current = e;
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" 
              placeholder="Company or Name" 
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
            <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input 
              {...register('email')} 
              id="client-email"
              type="email"
              autoComplete="email"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" 
              placeholder="name@company.com" 
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone</label>
            <input 
              {...register('phoneNumber')} 
              id="client-phone"
              type="tel"
              autoComplete="tel"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" 
              placeholder="+1..." 
            />
          </div>
        </div>

        <div>
          <label htmlFor="client-address" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Address</label>
          <textarea 
            {...register('address')} 
            id="client-address"
            rows={3} 
            autoComplete="street-address"
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" 
            placeholder="1234 Main St..." 
          />
        </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-black dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
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