import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { InvoiceForm } from '../../features/invoices/components/InvoiceForm'; // 👈 Import reusable form
import { type CreateInvoiceDTO } from "@erp/types";
import { Loader2 } from 'lucide-react';

export default function InvoiceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await api.get(`/invoices/${id}`);
        const inv = data.data;
        
        // Transform API data to Form Data
        setInitialData({
            ...inv,
            // 💡 Important: Helper for AsyncSelect to show name instantly
            clientName: inv.clientId?.name, 
            clientId: inv.clientId?._id, // Extract ID
            date: new Date(inv.date).toISOString().split('T')[0],
            expiredDate: new Date(inv.expiredDate).toISOString().split('T')[0]
        });
      } catch (error) {
        toast.error("Failed to load invoice");
        navigate('/invoices');
      }
    };
    fetchInvoice();
  }, [id, navigate]);

  const handleSubmit = async (data: CreateInvoiceDTO) => {
    setIsLoading(true);
    try {
      await api.put(`/invoices/${id}`, data);
      toast.success('Invoice updated successfully!');
      navigate('/invoices');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialData) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Invoice #{initialData.number}</h1>
        {/* ✅ Use the reusable component with initial data */}
        <InvoiceForm 
            initialValues={initialData} 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
            isEditMode 
        />
      </main>
    </div>
  );
}