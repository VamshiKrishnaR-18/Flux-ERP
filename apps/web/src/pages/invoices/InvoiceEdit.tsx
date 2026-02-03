import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { CreateInvoiceSchema, type CreateInvoiceDTO, type Client, type Product } from "@erp/types";

export default function InvoiceEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]); 
  const [isLoading, setIsLoading] = useState(false);

  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    reset,
    setValue, 
    formState: { errors } // 👈 This is the variable causing the warning
  } = useForm<CreateInvoiceDTO>({
    resolver: zodResolver(CreateInvoiceSchema) as any,
    defaultValues: {
      items: [{ itemName: '', description: '', quantity: 1, price: 0, total: 0 }]
    } as any
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Watch values for Math
  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");

  // Instant Math
  const currentItems = items || [];
  const calculatedSubTotal = currentItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  const calculatedTaxTotal = (calculatedSubTotal * (taxRate || 0)) / 100;
  const calculatedTotal = (calculatedSubTotal + calculatedTaxTotal) - (discount || 0);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, productsRes, invoiceRes] = await Promise.all([
          api.get('/clients'),
          api.get('/products'),
          api.get(`/invoices/${id}`)
        ]);

        setClients(clientsRes.data.data);
        setProducts(productsRes.data.data);
        
        const inv = invoiceRes.data.data;

        reset({
            ...inv,
            date: new Date(inv.date).toISOString().split('T')[0],
            expiredDate: new Date(inv.expiredDate).toISOString().split('T')[0],
            clientId: typeof inv.clientId === 'object' ? inv.clientId._id : inv.clientId,
        });

      } catch (error) {
        toast.error("Failed to load invoice details");
        navigate('/invoices');
      }
    };
    if (id) loadData();
  }, [id, reset, navigate]);

  // Product Auto-fill Logic
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
        const options = { shouldValidate: true, shouldDirty: true };
        setValue(`items.${index}.itemName`, product.name, options);
        setValue(`items.${index}.description`, product.description || '', options);
        setValue(`items.${index}.price`, product.price, options);
        setValue(`items.${index}.quantity`, 1, options);
    }
  };

  const onSubmit = async (data: CreateInvoiceDTO) => {
    setIsLoading(true);
    const toastId = toast.loading("Updating invoice...");

    const payload = {
        ...data,
        subTotal: calculatedSubTotal,
        taxTotal: calculatedTaxTotal,
        total: calculatedTotal
    };

    try {
      await api.put(`/invoices/${id}`, payload);
      toast.success('Invoice updated successfully!', { id: toastId });
      navigate('/invoices');
    } catch (error: any) {
      console.error(error);
      toast.error('Update failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Edit Invoice</h1>
            <button onClick={() => navigate('/invoices')} className="text-gray-500 hover:text-gray-900">Cancel</button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-sm border">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 1. Client */}
            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <select {...register("clientId")} className="w-full border p-2 rounded">
                <option value="">Select Client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {/* ✅ FIX: Use 'errors' to show validation message */}
              {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>}
            </div>

            {/* 2. Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select {...register("status")} className="w-full border p-2 rounded bg-yellow-50 border-yellow-200 text-yellow-800 font-medium">
                <option value="draft">📝 Draft</option>
                <option value="pending">⏳ Pending</option>
                <option value="sent">✉️ Sent</option>
                <option value="paid">✅ Paid</option>
                <option value="overdue">⚠️ Overdue</option>
              </select>
            </div>
            
            {/* 3. Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" {...register("date")} className="w-full border p-2 rounded" />
                {errors.date && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input type="date" {...register("expiredDate")} className="w-full border p-2 rounded" />
                {errors.expiredDate && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-8">
            <h3 className="font-bold mb-4">Items</h3>
            
            <div className="space-y-4">
                {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                    
                    <div className="flex-1 space-y-2">
                        <select 
                            className="w-full text-xs border border-blue-200 bg-blue-50 text-blue-800 p-1.5 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>✨ Auto-fill from Inventory...</option>
                            {products.map(p => (
                                <option key={p._id} value={p._id}>{p.name} (${p.price})</option>
                            ))}
                        </select>

                        <input placeholder="Item Name" {...register(`items.${index}.itemName`)} className="w-full border p-2 rounded bg-white" />
                        
                        {/* ✅ FIX: Use 'errors' for array items */}
                        {(errors.items as any)?.[index]?.itemName && (
                            <p className="text-red-500 text-xs">Item name required</p>
                        )}

                        <input placeholder="Description" {...register(`items.${index}.description`)} className="w-full border p-2 rounded text-sm text-gray-600 bg-white" />
                    </div>

                    <div className="w-20">
                        <label className="text-xs text-gray-500 block mb-1">Qty</label>
                        <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" />
                    </div>

                    <div className="w-32">
                        <label className="text-xs text-gray-500 block mb-1">Price</label>
                        <input type="number" step="0.01" {...register(`items.${index}.price`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" />
                    </div>

                    <div className="w-24 text-right pt-6 font-bold text-gray-700">
                        ${((items?.[index]?.quantity || 0) * (items?.[index]?.price || 0)).toFixed(2)}
                    </div>

                    <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 px-2 pt-6">✕</button>
                </div>
                ))}
            </div>

            <button type="button" onClick={() => append({ itemName: '', description: '', quantity: 1, price: 0, total: 0 })} className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
                + Add Another Item
            </button>
          </div>

          <div className="flex justify-end border-t pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${calculatedSubTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tax Rate (%):</span>
                <input type="number" {...register("taxRate", { valueAsNumber: true })} className="w-20 border p-1 rounded text-right text-sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Discount ($):</span>
                <input type="number" {...register("discount", { valueAsNumber: true })} className="w-20 border p-1 rounded text-right text-sm" />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3 mt-2 text-gray-900">
                <span>Total:</span>
                <span>${calculatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/invoices')} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={isLoading} className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}