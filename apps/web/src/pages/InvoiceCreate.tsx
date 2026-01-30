import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
// 1. IMPORT TOAST
import { toast } from 'sonner';

// Import Shared Types
import { CreateInvoiceSchema, type CreateInvoiceDTO, type Client } from "@erp/types";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('token');

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
      items: [{ itemName: '', description: '', quantity: 1, price: 0, total: 0 }]
    } as any 
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");

  useEffect(() => {
    const currentItems = items || [];
    const subTotal = currentItems.reduce((sum: number, item: any) => {
      return sum + ((item.quantity || 0) * (item.price || 0));
    }, 0);

    const taxTotal = (subTotal * (taxRate || 0)) / 100;
    const total = (subTotal + taxTotal) - (discount || 0);

    setValue("subTotal", subTotal);
    setValue("taxTotal", taxTotal);
    setValue("total", total);
  }, [items, taxRate, discount, setValue]);

  useEffect(() => {
    axios.get('http://localhost:3000/clients', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setClients(res.data.data))
    .catch(() => toast.error("Failed to load clients")); // Added toast here too
  }, [token]);

  const onSubmit = async (data: CreateInvoiceDTO) => {
    setIsLoading(true);
    // Optional: Show loading toast
    const toastId = toast.loading("Creating invoice..."); 

    try {
      await axios.post('http://localhost:3000/invoices', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 2. SUCCESS NOTIFICATION 🟢
      toast.success('Invoice created successfully!', { id: toastId });
      navigate('/invoices'); // Redirect to list
    } catch (error: any) {
      console.error(error);
      // 3. ERROR NOTIFICATION 🔴
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

          <div className="mb-8">
            <h3 className="font-bold mb-4">Items</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 mb-2 items-start">
                <div className="flex-1">
                  <input 
                    placeholder="Item Name" 
                    {...register(`items.${index}.itemName`)} 
                    className="w-full border p-2 rounded" 
                  />
                  {(errors.items as any)?.[index]?.itemName && (
                    <p className="text-red-500 text-xs">Required</p>
                  )}
                </div>
                <input 
                  type="number" placeholder="Qty" 
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                  className="w-20 border p-2 rounded text-right" 
                />
                <input 
                  type="number" placeholder="Price" 
                  {...register(`items.${index}.price`, { valueAsNumber: true })} 
                  className="w-32 border p-2 rounded text-right" 
                />
                <div className="w-32 py-2 text-right font-bold text-gray-700">
                  ${((items?.[index]?.quantity || 0) * (items?.[index]?.price || 0)).toFixed(2)}
                </div>
                <button type="button" onClick={() => remove(index)} className="text-red-500 px-2 py-2">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ itemName: '', quantity: 1, price: 0, total: 0 })} className="text-blue-600 text-sm font-medium">
              + Add Item
            </button>
          </div>

          <div className="flex justify-end border-t pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${watch("subTotal")?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Rate (%):</span>
                <input 
                  type="number" 
                  {...register("taxRate", { valueAsNumber: true })} 
                  className="w-16 border p-1 rounded text-right" 
                />
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <input 
                  type="number" 
                  {...register("discount", { valueAsNumber: true })} 
                  className="w-16 border p-1 rounded text-right" 
                />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${watch("total")?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Create Invoice'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}