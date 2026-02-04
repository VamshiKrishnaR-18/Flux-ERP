import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { InvoiceForm } from '../../features/invoices/components/InvoiceForm'; // 👈 Import reusable form
import { type CreateInvoiceDTO } from "@erp/types";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateInvoiceDTO) => {
    setIsLoading(true);
    try {
      await api.post('/invoices', data);
      toast.success('Invoice created successfully!');
      navigate('/invoices');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Invoice</h1>
        {/* ✅ Use the reusable component */}
        <InvoiceForm onSubmit={handleSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}