import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, type DefaultValues, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { AsyncSelect } from '../../components/AsyncSelect'; // 👈 Using the component
import { CreateInvoiceSchema, type CreateInvoiceDTO } from "@erp/types";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Defaults
  const defaultValues: DefaultValues<CreateInvoiceDTO> = {
    recurring: 'none',
    status: 'draft',
    paymentStatus: 'unpaid',
    currency: 'USD',
    taxRate: 0,
    discount: 0,
    subTotal: 0,
    taxTotal: 0,
    total: 0,
    credit: 0,
    date: new Date().toISOString().split('T')[0],
    expiredDate: new Date().toISOString().split('T')[0],
    items: [{ itemName: '', description: '', quantity: 1, price: 0, total: 0 }],
    notes: ''
  };

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateInvoiceDTO>({
    resolver: zodResolver(CreateInvoiceSchema) as Resolver<CreateInvoiceDTO>,
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Watchers & Math
  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");

  const currentItems = items || [];
  const calculatedSubTotal = currentItems.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  const calculatedTaxTotal = (calculatedSubTotal * (taxRate || 0)) / 100;
  const calculatedTotal = (calculatedSubTotal + calculatedTaxTotal) - (discount || 0);

  // ✅ SERVER-SIDE FETCHERS
  const fetchClients = async (query: string) => {
    const res = await api.get(`/clients?search=${query}&limit=20`);
    return res.data.data;
  };

  const fetchProducts = async (query: string) => {
    const res = await api.get(`/products?search=${query}&limit=20`);
    return res.data.data;
  };

  // ✅ LOAD SETTINGS ONLY (Removed Clients/Products bulk fetch)
  useEffect(() => {
    const loadSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            const settings = data.data;
            if (settings) {
               if (settings.taxRate) setValue('taxRate', settings.taxRate);
               if (settings.defaultNotes) setValue('notes', settings.defaultNotes);
               if (settings.defaultPaymentTerms) {
                   const d = new Date();
                   d.setDate(d.getDate() + settings.defaultPaymentTerms);
                   setValue('expiredDate', d.toISOString().split('T')[0]);
               }
            }
        } catch (error) { console.error("Settings load failed"); }
    };
    loadSettings();
  }, [setValue]);

  // ✅ OPTIMIZED PRODUCT SELECT
  const handleProductSelect = async (index: number, productId: string) => {
    if (!productId) return;
    try {
        // Fetch single product details on demand (Scalable!)
        const { data } = await api.get(`/products/${productId}`);
        const product = data.data;

        setValue(`items.${index}.productId`, product._id);
        setValue(`items.${index}.itemName`, product.name);
        setValue(`items.${index}.description`, product.description || '');
        setValue(`items.${index}.price`, product.price);
        setValue(`items.${index}.quantity`, 1);
    } catch (err) {
        toast.error("Could not load product details");
    }
  };

  const onSubmit = async (data: CreateInvoiceDTO) => {
    setIsLoading(true);
    const toastId = toast.loading("Creating invoice..."); 
    try {
      await api.post('/invoices', { ...data, subTotal: calculatedSubTotal, taxTotal: calculatedTaxTotal, total: calculatedTotal });
      toast.success('Invoice created!', { id: toastId });
      navigate('/invoices');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed', { id: toastId });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">New Invoice</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-sm border">
          
          {/* Client Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <AsyncSelect
                label="Client"
                placeholder="Search Client..."
                fetcher={fetchClients}
                renderOption={(c) => c.name}
                onChange={(id) => setValue('clientId', id, { shouldValidate: true })}
                error={errors.clientId?.message}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" {...register("date")} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" {...register("expiredDate")} className="w-full border p-2 rounded" /></div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-8">
            <h3 className="font-bold mb-4">Items</h3>
            <div className="space-y-4">
                {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex-1 space-y-2">
                        {/* ✅ ASYNC PRODUCT SEARCH */}
                        <div className="mb-2">
                             <AsyncSelect
                                label="" 
                                placeholder="✨ Search Inventory..."
                                fetcher={fetchProducts}
                                renderOption={(p) => `${p.name} ($${p.price})`}
                                onChange={(id) => handleProductSelect(index, id)}
                             />
                        </div>

                        <input placeholder="Item Name" {...register(`items.${index}.itemName`)} className="w-full border p-2 rounded bg-white" />
                        {(errors.items as any)?.[index]?.itemName && <p className="text-red-500 text-xs">Required</p>}
                        <input placeholder="Description" {...register(`items.${index}.description`)} className="w-full border p-2 rounded text-sm text-gray-600 bg-white" />
                    </div>
                    <div className="w-20"><label className="text-xs text-gray-500 block mb-1">Qty</label><input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" /></div>
                    <div className="w-32"><label className="text-xs text-gray-500 block mb-1">Price</label><input type="number" step="0.01" {...register(`items.${index}.price`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" /></div>
                    <div className="w-24 text-right pt-6 font-bold text-gray-700">${((items?.[index]?.quantity || 0) * (items?.[index]?.price || 0)).toFixed(2)}</div>
                    <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 px-2 pt-6">✕</button>
                </div>
                ))}
            </div>
            <button type="button" onClick={() => append({ itemName: '', description: '', quantity: 1, price: 0, total: 0 })} className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">+ Add Another Item</button>
          </div>

          {/* Totals & Notes (Unchanged) */}
          <div className="flex justify-end border-t pt-4">
             {/* ... (Same as before) ... */}
             <div className="w-64 space-y-2">
               <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>${calculatedTotal.toFixed(2)}</span></div>
             </div>
          </div>
           
          <div className="mt-8 pt-6 border-t border-gray-100">
             <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
             <textarea {...register('notes')} rows={3} className="w-full p-3 border rounded-lg" />
          </div>

          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={isLoading} className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50">
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}