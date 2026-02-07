import { useEffect } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateInvoiceSchema, type CreateInvoiceDTO, CURRENCIES } from "@erp/types";
import { api } from '../../../lib/axios';
import { AsyncSelect } from '../../../components/AsyncSelect';
import { Plus, Trash2, Loader2, Save, Calendar, CreditCard } from 'lucide-react';

interface InvoiceFormProps {
  initialValues?: Partial<CreateInvoiceDTO> & { clientName?: string };
  onSubmit: (data: CreateInvoiceDTO) => Promise<void>;
  isLoading: boolean;
  isEditMode?: boolean;
}

export function InvoiceForm({ initialValues, onSubmit, isLoading, isEditMode }: InvoiceFormProps) {
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateInvoiceDTO>({
    resolver: zodResolver(CreateInvoiceSchema) as Resolver<CreateInvoiceDTO>,
    defaultValues: {
      items: [{ itemName: '', quantity: 1, price: 0, total: 0 }],
      currency: 'USD',
      status: 'draft',
      paymentStatus: 'unpaid',
      taxRate: 0,
      discount: 0,
      date: new Date().toISOString().split('T')[0],
      expiredDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      ...initialValues
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  
  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");
  const currency = watch("currency");

  // Calculations
  const calculatedSubTotal = items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
  const calculatedTax = calculatedSubTotal * (taxRate / 100);
  const calculatedTotal = calculatedSubTotal + calculatedTax - discount;

  // Data Fetchers
  const fetchClients = async (q: string) => (await api.get(`/clients?search=${q}&limit=20`)).data.data;
  const fetchProducts = async (q: string) => (await api.get(`/products?search=${q}&limit=20`)).data.data;

  // Load Settings (Only if creating new)
  useEffect(() => {
    if (!isEditMode) {
      api.get('/settings').then(({ data }) => {
        if (data.data) {
          const s = data.data;
          if (s.taxRate) setValue('taxRate', s.taxRate);
          if (s.currency) setValue('currency', s.currency);
          if (s.defaultNotes) setValue('notes', s.defaultNotes);
          if (s.defaultPaymentTerms) {
             const d = new Date(); 
             d.setDate(d.getDate() + s.defaultPaymentTerms);
             setValue('expiredDate', d.toISOString().split('T')[0]);
          }
        }
      }).catch(() => {});
    }
  }, [isEditMode, setValue]);

  const handleProductSelect = async (index: number, productId: string) => {
    if(!productId) return;
    try {
        const { data } = await api.get(`/products/${productId}`);
        const p = data.data;
        setValue(`items.${index}.productId`, productId);
        setValue(`items.${index}.itemName`, p.name);
        setValue(`items.${index}.description`, p.description || '');
        setValue(`items.${index}.price`, p.price);
        setValue(`items.${index}.quantity`, 1);
    } catch(e) { console.error(e); }
  };

  const submitHandler = (data: CreateInvoiceDTO) => {
    onSubmit({ 
        ...data, 
        subTotal: calculatedSubTotal, 
        taxTotal: calculatedTax, 
        total: calculatedTotal 
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-in fade-in duration-300">
        
        {/* --- HEADER SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 pb-8 border-b border-gray-100">
            <div className="lg:col-span-1 space-y-4">
                <AsyncSelect 
                    label="Client" 
                    placeholder="Search Client..." 
                    fetcher={fetchClients} 
                    renderOption={(c: { _id: string; name: string }) => c.name} 
                    getOptionLabel={(c: { _id: string; name: string }) => c.name}
                    onChange={(id) => setValue('clientId', id, { shouldValidate: true })} 
                    initialLabel={initialValues?.clientName} 
                    error={errors.clientId?.message}
                />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <select {...register("currency")} className="w-full pl-9 pr-4 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                            {CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block"></div>

            <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input type="date" {...register("date")} className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input type="date" {...register("expiredDate")} className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
              </div>
            </div>
        </div>

        {/* --- ITEMS SECTION --- */}
        <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-900">Invoice Items</h3>
            </div>
            
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col lg:flex-row gap-4 items-start bg-gray-50/50 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                        
                        {/* Product Search & Meta */}
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <AsyncSelect
                                    label="" 
                                    placeholder="Select Product (Optional)"
                                    fetcher={fetchProducts}
                                    renderOption={(p: { _id: string; name: string; price: number }) => `${p.name} - ${currency} ${p.price}`}
                                    getOptionLabel={(p: { _id: string; name: string }) => p.name}
                                    onChange={(id) => handleProductSelect(index, id)}
                                />
                            </div>
                            <input 
                                placeholder="Item Name" 
                                {...register(`items.${index}.itemName`)} 
                                className={`w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.items?.[index]?.itemName ? 'border-red-300' : ''}`} 
                            />
                            <input 
                                placeholder="Description" 
                                {...register(`items.${index}.description`)} 
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                        </div>
                        
                        {/* Qty & Price */}
                        <div className="flex gap-3 w-full lg:w-auto items-center">
                            <div className="w-24">
                                <label className="block text-xs text-gray-500 mb-1 lg:hidden">Qty</label>
                                <input 
                                    type="number" 
                                    placeholder="Qty" 
                                    {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                                    className="w-full px-3 py-2 border rounded-lg text-right focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-xs text-gray-500 mb-1 lg:hidden">Price</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="Price" 
                                    {...register(`items.${index}.price`, { valueAsNumber: true })} 
                                    className="w-full px-3 py-2 border rounded-lg text-right focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div className="pt-0 lg:pt-0">
                                <button 
                                    type="button" 
                                    onClick={() => remove(index)} 
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                type="button" 
                onClick={() => append({ itemName: '', description: '', quantity: 1, price: 0, total: 0 })} 
                className="mt-4 text-blue-600 font-medium text-sm flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Line Item
            </button>
        </div>

        {/* --- FOOTER & TOTALS --- */}
        <div className="flex flex-col lg:flex-row justify-between border-t border-gray-100 pt-8 gap-12">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Terms</label>
                <textarea 
                    {...register('notes')} 
                    rows={4} 
                    className="w-full px-4 py-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all" 
                    placeholder="Payment details, thank you notes, etc..." 
                />
            </div>

            <div className="w-full lg:w-80 space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{calculatedSubTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center gap-1">Tax Rate (%)</span>
                    <input 
                        type="number" 
                        step="0.01" 
                        {...register("taxRate", { valueAsNumber: true })} 
                        className="w-20 px-2 py-1 border rounded text-right focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Discount</span>
                    <input 
                        type="number" 
                        step="0.01" 
                        {...register("discount", { valueAsNumber: true })} 
                        className="w-24 px-2 py-1 border rounded text-right focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>

                <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-gray-100 text-gray-900">
                    <span>Total ({currency})</span>
                    <span>{calculatedTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* --- ACTIONS --- */}
        <div className="mt-10 flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button 
                type="submit" 
                disabled={isLoading} 
                className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform active:scale-95"
            >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                {isEditMode ? 'Update Invoice' : 'Create Invoice'}
            </button>
        </div>
    </form>
  );
}
