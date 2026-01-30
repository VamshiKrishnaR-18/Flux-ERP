import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import { CreateInvoiceSchema, type CreateInvoiceDTO, type Client } from "@erp/types";

export default function InvoiceEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('token');

  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    reset,
    formState: { errors } 
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

  // 1. WATCH VALUES
  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");

  // 2. INSTANT MATH (Derived State) ⚡
  // We calculate these every time the component renders. No useEffect needed!
  const currentItems = items || [];
  const calculatedSubTotal = currentItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  const calculatedTaxTotal = (calculatedSubTotal * (taxRate || 0)) / 100;
  const calculatedTotal = (calculatedSubTotal + calculatedTaxTotal) - (discount || 0);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const clientsRes = await axios.get('http://localhost:3000/clients', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setClients(clientsRes.data.data);

        const invoiceRes = await axios.get(`http://localhost:3000/invoices/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
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
    loadData();
  }, [id, token, reset, navigate]);

  // Submit Handler
  const onSubmit = async (data: CreateInvoiceDTO) => {
    setIsLoading(true);
    const toastId = toast.loading("Updating invoice...");

    // 3. RE-CALCULATE FOR SAVE
    // We recalculate here to ensure the payload sent to the backend is perfect
    const finalItems = data.items || [];
    const subTotal = finalItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    const taxTotal = (subTotal * (data.taxRate || 0)) / 100;
    const total = (subTotal + taxTotal) - (data.discount || 0);

    const payload = {
        ...data,
        subTotal,
        taxTotal,
        total
    };

    try {
      const response = await axios.put(`http://localhost:3000/invoices/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Invoice updated successfully!', { id: toastId });
        navigate('/invoices');
      }
    } catch (error: any) {
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
          
          {/* Client & Dates */}
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

          {/* Items */}
          <div className="mb-8">
            <h3 className="font-bold mb-4">Items</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 mb-2 items-start">
                <div className="flex-1">
                  <input placeholder="Item Name" {...register(`items.${index}.itemName`)} className="w-full border p-2 rounded" />
                  {(errors.items as any)?.[index]?.itemName && <p className="text-red-500 text-xs">Required</p>}
                </div>
                <input type="number" placeholder="Qty" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-20 border p-2 rounded text-right" />
                <input type="number" placeholder="Price" {...register(`items.${index}.price`, { valueAsNumber: true })} className="w-32 border p-2 rounded text-right" />
                
                {/* 4. UPDATE ROW TOTAL DISPLAY */}
                <div className="w-32 py-2 text-right font-bold text-gray-700">
                  ${((items?.[index]?.quantity || 0) * (items?.[index]?.price || 0)).toFixed(2)}
                </div>
                <button type="button" onClick={() => remove(index)} className="text-red-500 px-2 py-2">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ itemName: '', quantity: 1, price: 0, total: 0 })} className="text-blue-600 text-sm font-medium">+ Add Item</button>
          </div>

          {/* Totals Display */}
          <div className="flex justify-end border-t pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                {/* 5. USE CALCULATED VARIABLES HERE 👇 */}
                <span>${calculatedSubTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Rate (%):</span>
                <input type="number" {...register("taxRate", { valueAsNumber: true })} className="w-16 border p-1 rounded text-right" />
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <input type="number" {...register("discount", { valueAsNumber: true })} className="w-16 border p-1 rounded text-right" />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                {/* 5. USE CALCULATED VARIABLES HERE 👇 */}
                <span>${calculatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/invoices')} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Update Invoice'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}