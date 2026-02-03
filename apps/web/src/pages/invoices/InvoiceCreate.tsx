import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/axios';
import { toast } from 'sonner';

// Import Types
import { CreateInvoiceSchema, type CreateInvoiceDTO, type Client, type Product } from "@erp/types";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors } 
  } = useForm<CreateInvoiceDTO>({
    resolver: zodResolver(CreateInvoiceSchema) as any,
    defaultValues: {
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
      notes: '' // Initialize notes
    } as any 
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // 1. WATCH INPUTS
  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");

  // 2. INSTANT MATH
  const currentItems = items || [];
  const calculatedSubTotal = currentItems.reduce((sum: number, item: any) => {
    return sum + ((item.quantity || 0) * (item.price || 0));
  }, 0);

  const calculatedTaxTotal = (calculatedSubTotal * (taxRate || 0)) / 100;
  const calculatedTotal = (calculatedSubTotal + calculatedTaxTotal) - (discount || 0);

  // ✅ FETCH DATA & APPLY SETTINGS DEFAULTS
  useEffect(() => {
    const loadData = async () => {
        try {
            const [clientsRes, productsRes, settingsRes] = await Promise.all([
                api.get('/clients'),
                api.get('/products'),
                api.get('/settings') // 👈 FETCH SETTINGS
            ]);
            setClients(clientsRes.data.data);
            setProducts(productsRes.data.data);

            // ✨ MAGIC: Apply Defaults from Settings
            if (settingsRes.data.data) {
               const settings = settingsRes.data.data;
               
               // 1. Auto-set Tax Rate
               if (settings.taxRate) {
                   setValue('taxRate', settings.taxRate);
               }

               // 2. Auto-set Due Date based on Payment Terms
               if (settings.defaultPaymentTerms) {
                   const today = new Date();
                   const dueDate = new Date();
                   dueDate.setDate(today.getDate() + settings.defaultPaymentTerms);
                   setValue('expiredDate', dueDate.toISOString().split('T')[0]);
               }

               // 3. Auto-set Footer Notes
               if (settings.defaultNotes) {
                   setValue('notes', settings.defaultNotes);
               }
            }
        } catch (error) {
            toast.error("Failed to load data");
        }
    };
    loadData();
  }, [setValue]);

  // Auto-fill Product
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
        const options = { shouldValidate: true, shouldDirty: true };
        setValue(`items.${index}.productId`, product._id, options);
        setValue(`items.${index}.itemName`, product.name, options);
        setValue(`items.${index}.description`, product.description || '', options);
        setValue(`items.${index}.price`, product.price, options);
        setValue(`items.${index}.quantity`, 1, options);
    }
  };

  const onSubmit = async (data: CreateInvoiceDTO) => {
    setIsLoading(true);
    const toastId = toast.loading("Creating invoice..."); 

    const payload = {
        ...data,
        subTotal: calculatedSubTotal,
        taxTotal: calculatedTaxTotal,
        total: calculatedTotal
    };

    try {
      await api.post('/invoices', payload);
      toast.success('Invoice created successfully!', { id: toastId });
      navigate('/invoices');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create invoice', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">New Invoice</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-sm border">
          
          {/* Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <select {...register("clientId")} className="w-full border p-2 rounded">
                <option value="">Select Client...</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.clientId && <p className="text-red-500 text-sm">{errors.clientId.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" {...register("date")} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input type="date" {...register("expiredDate")} className="w-full border p-2 rounded" />
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
                        {/* Product Selector */}
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

                        <input 
                            placeholder="Item Name" 
                            {...register(`items.${index}.itemName`)} 
                            className="w-full border p-2 rounded bg-white" 
                        />
                        {(errors.items as any)?.[index]?.itemName && (
                            <p className="text-red-500 text-xs mt-1">Required</p>
                        )}

                        <input 
                            placeholder="Description" 
                            {...register(`items.${index}.description`)} 
                            className="w-full border p-2 rounded text-sm text-gray-600 bg-white" 
                        />
                    </div>

                    {/* Quantity */}
                    <div className="w-20">
                        <label className="text-xs text-gray-500 block mb-1">Qty</label>
                        <input 
                            type="number" 
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                            className="w-full border p-2 rounded text-right" 
                        />
                    </div>

                    {/* Price */}
                    <div className="w-32">
                        <label className="text-xs text-gray-500 block mb-1">Price</label>
                        <input 
                            type="number" 
                            step="0.01"
                            {...register(`items.${index}.price`, { valueAsNumber: true })} 
                            className="w-full border p-2 rounded text-right" 
                        />
                    </div>

                    {/* Row Total */}
                    <div className="w-24 text-right pt-6 font-bold text-gray-700">
                        ${((items?.[index]?.quantity || 0) * (items?.[index]?.price || 0)).toFixed(2)}
                    </div>

                    <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 px-2 pt-6">
                        ✕
                    </button>
                </div>
                ))}
            </div>

            <button 
                type="button" 
                onClick={() => append({ itemName: '', description: '', quantity: 1, price: 0, total: 0 })} 
                className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
            >
                + Add Another Item
            </button>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end border-t pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${calculatedSubTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tax Rate (%):</span>
                <input 
                  type="number" 
                  step="0.01"
                  {...register("taxRate", { valueAsNumber: true })} 
                  className="w-20 border p-1 rounded text-right text-sm" 
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Discount ($):</span>
                <input 
                  type="number" 
                  step="0.01"
                  {...register("discount", { valueAsNumber: true })} 
                  className="w-20 border p-1 rounded text-right text-sm" 
                />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3 mt-2 text-gray-900">
                <span>Total:</span>
                <span>${calculatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes Section (Now Auto-filled) */}
          <div className="mt-8 pt-6 border-t border-gray-100">
             <label className="block text-sm font-medium text-gray-700 mb-2">Notes & Terms</label>
             <textarea 
                {...register('notes')}
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Add any notes here..."
             />
          </div>

          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={isLoading} className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}