import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { InvoiceForm } from '../../features/invoices/components/InvoiceForm'; 
import { type CreateInvoiceDTO } from "@erp/types";
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function InvoiceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invoiceData, isLoading: isFetching } = useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${id}`);
      const inv = data.data;
      return {
        ...inv,
        clientName: inv.clientId?.name, 
        clientId: inv.clientId?._id, 
        date: new Date(inv.date).toISOString().split('T')[0],
        expiredDate: new Date(inv.expiredDate).toISOString().split('T')[0]
      };
    },
    enabled: !!id
  });

  const mutation = useMutation({
    mutationFn: (data: CreateInvoiceDTO) => api.put(`/invoices/${id}`, data),
    onSuccess: () => {
      toast.success('Invoice updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoices');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
    }
  });

  if (isFetching || !invoiceData) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 w-10 h-10" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-12 transition-colors">
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6 tracking-tight">Edit Invoice #{invoiceData.number}</h1>
        
        <InvoiceForm 
            initialValues={invoiceData} 
            onSubmit={async (data) => { await mutation.mutateAsync(data); }} 
            isLoading={mutation.isPending} 
            isEditMode 
        />
      </main>
    </div>
  );
}