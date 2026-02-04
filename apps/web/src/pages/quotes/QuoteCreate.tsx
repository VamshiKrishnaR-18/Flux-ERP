import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { AsyncSelect } from '../../components/AsyncSelect'; // 👈 Import

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
  const subTotal = items?.reduce((acc, item) => acc + (item.quantity * item.price), 0) || 0;

  // ✅ FETCHERS
  const fetchClients = async (q: string) => (await api.get(`/clients?search=${q}&limit=20`)).data.data;
  const fetchProducts = async (q: string) => (await api.get(`/products?search=${q}&limit=20`)).data.data;

  // ✅ ON-DEMAND PRODUCT LOAD
  const handleProductSelect = async (index: number, id: string) => {
    if (!id) return;
    try {
        const { data } = await api.get(`/products/${id}`);
        const p = data.data;
        setValue(`items.${index}.itemName`, p.name);
        setValue(`items.${index}.price`, p.price);
    } catch (e) { console.error(e); }
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
                
                <div className="grid grid-cols-2 gap-6">
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
                        <div key={field.id} className="flex gap-2 items-end">
                            <div className="flex-1">
                                {/* ✅ ASYNC PRODUCT SELECT */}
                                <div className="mb-1">
                                    <AsyncSelect
                                        label=""
                                        fetcher={fetchProducts}
                                        renderOption={(p) => p.name}
                                        onChange={(id) => handleProductSelect(index, id)}
                                        placeholder="+ Auto-fill Product"
                                    />
                                </div>
                                <input {...register(`items.${index}.itemName`)} className="w-full border p-2 rounded" placeholder="Item Name" required />
                            </div>
                            <div className="w-20"><input type="number" {...register(`items.${index}.quantity`)} className="w-full border p-2 rounded" placeholder="Qty" /></div>
                            <div className="w-32"><input type="number" step="0.01" {...register(`items.${index}.price`)} className="w-full border p-2 rounded" placeholder="Price" /></div>
                            <button type="button" onClick={() => remove(index)} className="text-red-500 p-2">✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => append({ itemName: '', quantity: 1, price: 0, total: 0 })} className="text-blue-600 font-medium">+ Add Item</button>
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                    <div className="text-xl font-bold">Total: ${subTotal.toFixed(2)}</div>
                    <button type="submit" disabled={isLoading} className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800">
                        {isLoading ? "Saving..." : "Save Quote"}
                    </button>
                </div>
            </form>
        </main>
    </div>
  );
}