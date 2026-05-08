import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { api } from '../../lib/axios';
import { toast } from 'sonner';
import { AsyncSelect } from '../../components/AsyncSelect';
import type { Client, Product, CreateQuoteDTO } from '@erp/types';
import axios from 'axios';

export default function QuoteCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue } = useForm<CreateQuoteDTO>({
    defaultValues: {
      title: '',
      clientId: '',
      date: new Date().toISOString().split('T')[0],
      expiredDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items: [{ itemName: '', quantity: 1, price: 0, total: 0 }],
      status: 'draft',
      currency: 'USD',
      subTotal: 0,
      taxRate: 0,
      taxTotal: 0,
      total: 0,
      discount: 0,
      credit: 0
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  
 
  const subTotal = (items || []).reduce((acc, item) => acc + ((item.quantity || 0) * (item.price || 0)), 0);

  
  const fetchClients = useCallback(async (q: string): Promise<Client[]> => {
    const res = await api.get(`/clients?search=${q}&limit=20`);
    return res.data.data;
  }, []);

  const fetchProducts = useCallback(async (q: string): Promise<Product[]> => {
    const res = await api.get(`/products?search=${q}&limit=20`);
    return res.data.data;
  }, []);

  
  const handleProductSelect = async (index: number, id: string) => {
    if (!id) return;
    try {
        const { data } = await api.get(`/products/${id}`);
        const p = data.data;
        setValue(`items.${index}.productId`, id);
        setValue(`items.${index}.itemName`, p.name);
        setValue(`items.${index}.price`, p.price);
        setValue(`items.${index}.quantity`, 1); 
    } catch (e) { 
        console.error(e);
        toast.error("Failed to load product details");
    }
  };

  const onSubmit = async (data: CreateQuoteDTO) => {
    setIsLoading(true);
    try {
      await api.post('/quotes', { ...data, subTotal, total: subTotal });
      toast.success("Quote created!");
      navigate('/quotes');
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message 
        : "Failed to create quote";
      toast.error(message || "Failed to create quote");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 lg:p-10 transition-colors duration-200">
        <main className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-xl border border-transparent dark:border-slate-800 transition-colors">
            <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 mb-8 tracking-tight">New Quote</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label htmlFor="quote-title" className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Quote Title</label>
                        <input 
                            {...register("title")} 
                            id="quote-title"
                            autoComplete="off"
                            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                            placeholder="e.g. Website Redesign" 
                            required 
                        />
                    </div>
                    <div>
                        {/* ASYNC CLIENT SELECT */}
                        <AsyncSelect
                            label="Client"
                            id="clientId"
                            name="clientId"
                            fetcher={fetchClients}
                            renderOption={(c: Client) => c.name}
                            getOptionLabel={(c: Client) => c.name}
                            onChange={(id) => setValue('clientId', id)}
                            placeholder="Search Client..."
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                        <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Quote Items</h3>
                        <button type="button" onClick={() => append({ itemName: '', quantity: 1, price: 0, total: 0 })} className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-wider hover:underline">+ Add Another Item</button>
                    </div>
                    
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex-1 space-y-4 w-full">
                                    {/* ASYNC PRODUCT SELECT */}
                                    <AsyncSelect
                                        label="Product"
                                        id={`item-product-${index}`}
                                        name={`items.${index}.productId`}
                                        fetcher={fetchProducts}
                                        renderOption={(p: Product) => `${p.name} ($${p.price})`}
                                        getOptionLabel={(p: Product) => p.name}
                                        onChange={(id) => handleProductSelect(index, id)}
                                        placeholder="✨ Search Product..."
                                    />
                                    <label htmlFor={`item-name-${index}`} className="sr-only">Item Name</label>
                                    <input 
                                        {...register(`items.${index}.itemName`)} 
                                        id={`item-name-${index}`}
                                        autoComplete="off"
                                        className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" 
                                        placeholder="Item Name" 
                                        required 
                                    />
                                </div>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <div className="w-full sm:w-24">
                                        <label htmlFor={`item-quantity-${index}`} className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Qty</label>
                                        <input 
                                            type="number" 
                                            id={`item-quantity-${index}`}
                                            autoComplete="off"
                                            {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                                            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                                            placeholder="Qty" 
                                        />
                                    </div>
                                    <div className="w-full sm:w-36">
                                        <label htmlFor={`item-price-${index}`} className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 font-bold">$</span>
                                            <input 
                                                type="number" 
                                                id={`item-price-${index}`}
                                                step="0.01" 
                                                autoComplete="off"
                                                {...register(`items.${index}.price`, { valueAsNumber: true })} 
                                                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 pl-8 rounded-xl text-right outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold" 
                                                placeholder="0.00" 
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-8">
                                        <button type="button" onClick={() => remove(index)} aria-label="Remove item" className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">✕</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-10 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Estimated Total</span>
                        <div className="text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tight">${subTotal.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button type="button" onClick={() => navigate('/quotes')} className="flex-1 sm:flex-none px-8 py-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 font-bold transition-all">Cancel</button>
                        <button type="submit" disabled={isLoading} className="flex-1 sm:flex-none bg-blue-600 dark:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 disabled:opacity-50 transition-all">
                            {isLoading ? "Saving..." : "Save Quote"}
                        </button>
                    </div>
                </div>
            </form>
        </main>
    </div>
  );
}
