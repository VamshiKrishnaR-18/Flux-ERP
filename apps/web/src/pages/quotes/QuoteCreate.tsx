import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { api } from '../../lib/axios';
import { toast } from 'sonner';

export default function QuoteCreate() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      title: '',
      clientId: '',
      date: new Date().toISOString().split('T')[0],
      expiredDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items: [{ itemName: '', quantity: 1, price: 0, total: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Math Logic
  const items = watch("items");
  const subTotal = items?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;
  
  // Load Data
  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data.data));
    api.get('/products').then(res => setProducts(res.data.data));
  }, []);

  const handleProductSelect = (index: number, id: string) => {
    const p = products.find(x => x._id === id);
    if(p) {
        setValue(`items.${index}.itemName`, p.name);
        setValue(`items.${index}.price`, p.price);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await api.post('/quotes', { ...data, subTotal, total: subTotal }); // Simplified math for demo
      toast.success("Quote created!");
      navigate('/quotes');
    } catch (error) {
      toast.error("Failed to create quote");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
        <main className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow border">
            <h1 className="text-2xl font-bold mb-6">New Quote</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Quote Title</label>
                        <input {...register("title")} className="w-full border p-2 rounded" placeholder="e.g. Website Redesign" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Client</label>
                        <select {...register("clientId")} className="w-full border p-2 rounded" required>
                            <option value="">Select Client...</option>
                            {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold">Items</h3>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <select onChange={(e) => handleProductSelect(index, e.target.value)} className="w-full text-xs mb-1 text-blue-600 bg-blue-50 p-1 rounded">
                                    <option value="">+ Auto-fill Product</option>
                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                                <input {...register(`items.${index}.itemName`)} className="w-full border p-2 rounded" placeholder="Item Name" required />
                            </div>
                            <div className="w-20">
                                <input type="number" {...register(`items.${index}.quantity`)} className="w-full border p-2 rounded" placeholder="Qty" />
                            </div>
                            <div className="w-32">
                                <input type="number" step="0.01" {...register(`items.${index}.price`)} className="w-full border p-2 rounded" placeholder="Price" />
                            </div>
                            <button type="button" onClick={() => remove(index)} className="text-red-500 p-2">✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => append({ itemName: '', quantity: 1, price: 0, total: 0 })} className="text-blue-600 font-medium">+ Add Item</button>
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                    <div className="text-xl font-bold">Total: ${subTotal.toFixed(2)}</div>
                    <button type="submit" className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800">Save Quote</button>
                </div>
            </form>
        </main>
    </div>
  );
}