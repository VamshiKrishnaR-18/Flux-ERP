import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { AsyncSelect } from '../../components/AsyncSelect'; // 👈 Import AsyncSelect

export default function QuoteCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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
  const items = watch("items");
  
  // Safe math for total calculation
  const subTotal = (items || []).reduce((acc, item) => acc + ((item.quantity || 0) * (item.price || 0)), 0);

  // ✅ SERVER-SIDE SEARCH FETCHERS
  const fetchClients = async (q: string) => {
    const res = await api.get(`/clients?search=${q}&limit=20`);
    return res.data.data;
  };

  const fetchProducts = async (q: string) => {
    const res = await api.get(`/products?search=${q}&limit=20`);
    return res.data.data;
  };

  // ✅ AUTO-FILL PRODUCT DETAILS
  const handleProductSelect = async (index: number, id: string) => {
    if (!id) return;
    try {
        const { data } = await api.get(`/products/${id}`);
        const p = data.data;
        setValue(`items.${index}.itemName`, p.name);
        setValue(`items.${index}.price`, p.price);
        setValue(`items.${index}.quantity`, 1); // Default to 1
    } catch (e) { 
        console.error(e);
        toast.error("Failed to load product details");
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await api.post('/quotes', { ...data, subTotal, total: subTotal });
      toast.success("Quote created!");
      navigate('/quotes');
    } catch (error) {
      toast.error("Failed to create quote");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
        <main className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow border">
            <h1 className="text-2xl font-bold mb-6">New Quote</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Quote Title</label>
                        <input {...register("title")} className="w-full border p-2 rounded" placeholder="e.g. Website Redesign" required />
                    </div>
                    <div>
                        {/* ✅ ASYNC CLIENT SELECT */}
                        <AsyncSelect
                            label="Client"
                            fetcher={fetchClients}
                            renderOption={(c) => c.name}
                            onChange={(id) => setValue('clientId', id)}
                            placeholder="Search Client..."
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold">Items</h3>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex-1 space-y-2">
                                {/* ✅ ASYNC PRODUCT SELECT */}
                                <AsyncSelect
                                    label=""
                                    fetcher={fetchProducts}
                                    renderOption={(p) => `${p.name} ($${p.price})`}
                                    onChange={(id) => handleProductSelect(index, id)}
                                    placeholder="✨ Search Product..."
                                />
                                <input {...register(`items.${index}.itemName`)} className="w-full border p-2 rounded bg-white" placeholder="Item Name" required />
                            </div>
                            <div className="w-20">
                                <label className="text-xs text-gray-500 block mb-1">Qty</label>
                                <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" placeholder="Qty" />
                            </div>
                            <div className="w-32">
                                <label className="text-xs text-gray-500 block mb-1">Price</label>
                                <input type="number" step="0.01" {...register(`items.${index}.price`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" placeholder="Price" />
                            </div>
                            <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 px-2 pt-6">✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => append({ itemName: '', quantity: 1, price: 0, total: 0 })} className="text-blue-600 font-medium hover:underline">+ Add Item</button>
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                    <div className="text-xl font-bold">Total: ${subTotal.toFixed(2)}</div>
                    <button type="submit" disabled={isLoading} className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50">
                        {isLoading ? "Saving..." : "Save Quote"}
                    </button>
                </div>
            </form>
        </main>
    </div>
  );
}