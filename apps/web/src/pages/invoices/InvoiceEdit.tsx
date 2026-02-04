import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { AsyncSelect } from '../../components/AsyncSelect'; // 👈 Import
import { CreateInvoiceSchema, type CreateInvoiceDTO } from "@erp/types";

export default function InvoiceEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [initialClientName, setInitialClientName] = useState(''); // 👈 To show current client

  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<CreateInvoiceDTO>({
    resolver: zodResolver(CreateInvoiceSchema) as Resolver<CreateInvoiceDTO>,
    defaultValues: { items: [] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");
  const calculatedSubTotal = (items || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  const calculatedTotal = (calculatedSubTotal * (1 + (taxRate || 0)/100)) - (discount || 0);

  // ✅ FETCHERS
  const fetchClients = async (q: string) => (await api.get(`/clients?search=${q}&limit=20`)).data.data;
  const fetchProducts = async (q: string) => (await api.get(`/products?search=${q}&limit=20`)).data.data;

  // ✅ LOAD INVOICE ONLY (No bulk loads)
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get(`/invoices/${id}`);
        const inv = data.data;

        // Handle Client Pre-fill
        if (typeof inv.clientId === 'object') {
            setInitialClientName(inv.clientId.name);
            inv.clientId = inv.clientId._id; 
        }

        reset({
            ...inv,
            date: new Date(inv.date).toISOString().split('T')[0],
            expiredDate: new Date(inv.expiredDate).toISOString().split('T')[0],
        });
      } catch (error) {
        toast.error("Failed to load invoice");
        navigate('/invoices');
      }
    };
    if (id) loadData();
  }, [id, reset, navigate]);

  const handleProductSelect = async (index: number, productId: string) => {
    if(!productId) return;
    try {
        const { data } = await api.get(`/products/${productId}`);
        const p = data.data;
        setValue(`items.${index}.itemName`, p.name);
        setValue(`items.${index}.description`, p.description || '');
        setValue(`items.${index}.price`, p.price);
        setValue(`items.${index}.quantity`, 1);
    } catch(e) { console.error(e); }
  };

  const onSubmit = async (data: CreateInvoiceDTO) => {
    setIsLoading(true);
    try {
      await api.put(`/invoices/${id}`, { ...data, total: calculatedTotal });
      toast.success('Invoice updated!');
      navigate('/invoices');
    } catch (error) { toast.error('Update failed'); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Edit Invoice</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-sm border">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              {/* ✅ ASYNC CLIENT SELECT */}
              {/* Only render when we have the initial name (or if it's empty) to prevent layout shift */}
              <AsyncSelect
                label="Client"
                initialLabel={initialClientName} // 👈 Shows "John Doe" instead of "Search..."
                fetcher={fetchClients}
                renderOption={(c) => c.name}
                onChange={(id) => setValue('clientId', id, { shouldValidate: true })}
                error={errors.clientId?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select {...register("status")} className="w-full border p-2 rounded bg-yellow-50">
                <option value="draft">📝 Draft</option>
                <option value="pending">⏳ Pending</option>
                <option value="sent">✉️ Sent</option>
                <option value="paid">✅ Paid</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" {...register("date")} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" {...register("expiredDate")} className="w-full border p-2 rounded" /></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold mb-4">Items</h3>
            <div className="space-y-4">
                {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex-1 space-y-2">
                        {/* ✅ ASYNC PRODUCT SELECT */}
                        <AsyncSelect
                            label="" 
                            placeholder="✨ Change Product..."
                            fetcher={fetchProducts}
                            renderOption={(p) => `${p.name} ($${p.price})`}
                            onChange={(id) => handleProductSelect(index, id)}
                        />
                        <input placeholder="Item Name" {...register(`items.${index}.itemName`)} className="w-full border p-2 rounded bg-white" />
                        <input placeholder="Description" {...register(`items.${index}.description`)} className="w-full border p-2 rounded text-sm text-gray-600 bg-white" />
                    </div>
                    {/* Qty/Price Inputs ... */}
                    <div className="w-20"><input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" /></div>
                    <div className="w-32"><input type="number" step="0.01" {...register(`items.${index}.price`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" /></div>
                    <button type="button" onClick={() => remove(index)} className="text-red-400 p-2 pt-6">✕</button>
                </div>
                ))}
            </div>
            <button type="button" onClick={() => append({ itemName: '', description: '', quantity: 1, price: 0, total: 0 })} className="mt-4 text-blue-600">+ Add Item</button>
          </div>

          <div className="flex justify-end border-t pt-4">
            <div className="text-xl font-bold">Total: ${calculatedTotal.toFixed(2)}</div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="submit" disabled={isLoading} className="bg-black text-white px-8 py-3 rounded-lg font-bold">Save Changes</button>
          </div>
        </form>
      </main>
    </div>
  );
}