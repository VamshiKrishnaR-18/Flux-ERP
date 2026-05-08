import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { InvoiceForm } from '../../features/invoices/components/InvoiceForm'; 
import { type CreateInvoiceDTO } from "@erp/types";
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateInvoiceDTO) => api.post('/invoices', data),
    onSuccess: (res) => {
      const newInvoice = res.data.data;
      toast.success('Invoice created successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/invoices/${newInvoice._id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Creation failed';
      toast.error(message);
    }
  });

  const handleSubmit = async (data: CreateInvoiceDTO) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-12 transition-colors">
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6 tracking-tight">New Invoice</h1>
        
        <InvoiceForm onSubmit={handleSubmit} isLoading={mutation.isPending} />
      </main>
    </div>
  );
}