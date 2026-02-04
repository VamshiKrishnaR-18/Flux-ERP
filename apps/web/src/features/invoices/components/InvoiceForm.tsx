import { useEffect } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateInvoiceSchema, type CreateInvoiceDTO } from "@erp/types";
import { api } from '../../../lib/axios';
import { AsyncSelect } from '../../../components/AsyncSelect';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';

interface InvoiceFormProps {
  initialValues?: Partial<CreateInvoiceDTO> & { clientName?: string }; // clientName helper for Edit mode
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
      ...initialValues
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  
  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");
  const currency = watch("currency");

  // Real-time Calculations
  const calculatedSubTotal = items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
  const calculatedTax = calculatedSubTotal * (taxRate / 100);
  const calculatedTotal = calculatedSubTotal + calculatedTax - discount;

  // Data Fetchers
  const fetchClients = async (q: string) => (await api.get(`/clients?search=${q}&limit=20`)).data.data;
  const fetchProducts = async (q: string) => (await api.get(`/products?search=${q}&limit=20`)).data.data;

  // Load Global Settings (Only if NOT editing, or if currency is missing)
  useEffect(() => {
    if (!isEditMode) {
      api.get('/settings').then(({ data }) => {
        if (data.data) {
          const s = data.data;
          if (s.taxRate) setValue('taxRate', s.taxRate);
          if (s.currency) setValue('currency', s.currency);
          if (s.defaultNotes) setValue('notes', s.defaultNotes);
          if (s.defaultPaymentTerms) {
             const d = new Date(); d.setDate(d.getDate() + s.defaultPaymentTerms);
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
        setValue(`items.${index}.itemName`, p.name);
        setValue(`items.${index}.description`, p.description || '');
        setValue(`items.${index}.price`, p.price);
        setValue(`items.${index}.quantity`, 1);
    } catch(e) { console.error(e); }
  };

  const submitHandler = (data: CreateInvoiceDTO) => {
    // Inject calculated totals before sending
    onSubmit({ 
        ...data, 
        subTotal: calculatedSubTotal, 
        taxTotal: calculatedTax, 
        total: calculatedTotal 
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        
        {/* Top Section: Client & Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-1">
                <AsyncSelect 
                    label="Client" 
                    placeholder="Search Client..." 
                    fetcher={fetchClients} 
                    renderOption={(c) => c.name} 
                    onChange={(id) => setValue('clientId', id, { shouldValidate: true })} 
                    initialLabel={initialValues?.clientName} // ✅ Pre-fill Client Name in Edit Mode
                    error={errors.clientId?.message}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Currency</label>
                <select {...register("currency")} className="w-full border p-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Date</label>
                  <input type="date" {...register("date")} className="w-full border p-2 rounded-lg outline-none" />
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Due Date</label>
                  <input type="date" {...register("expiredDate")} className="w-full border p-2 rounded-lg outline-none" />
              </div>
            </div>
        </div>

        {/* Items List */}
        <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">Invoice Items</h3>
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col md:flex-row gap-3 items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex-1 w-full space-y-2">
                            <AsyncSelect
                                label="" 
                                placeholder="Select Product (Optional)"
                                fetcher={fetchProducts}
                                renderOption={(p) => `${p.name} - ${currency} ${p.price}`}
                                onChange={(id) => handleProductSelect(index, id)}
                            />
                            <div className="flex gap-2">
                                <input placeholder="Item Name" {...register(`items.${index}.itemName`)} className="flex-1 border p-2 rounded bg-white" />
                                <input placeholder="Description" {...register(`items.${index}.description`)} className="flex-1 border p-2 rounded bg-white text-sm" />
                            </div>
                            {errors.items?.[index]?.itemName && <span className="text-red-500 text-xs">Item name required</span>}
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="w-20">
                                <input type="number" placeholder="Qty" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" />
                            </div>
                            <div className="w-32">
                                <input type="number" step="0.01" placeholder="Price" {...register(`items.${index}.price`, { valueAsNumber: true })} className="w-full border p-2 rounded text-right" />
                            </div>
                            <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => append({ itemName: '', description: '', quantity: 1, price: 0, total: 0 })} className="mt-4 text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
                <Plus className="w-4 h-4" /> Add Line Item
            </button>
        </div>

        {/* Footer: Notes & Totals */}
        <div className="flex flex-col md:flex-row justify-between border-t pt-6 gap-12">
            <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-gray-700">Notes / Terms</label>
                <textarea {...register('notes')} rows={3} className="w-full border p-2 rounded-lg resize-none" placeholder="Thank you for your business..." />
            </div>

            <div className="w-full md:w-64 space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{calculatedSubTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center gap-1">Tax Rate (%)</span>
                    <input type="number" step="0.01" {...register("taxRate", { valueAsNumber: true })} className="w-16 border rounded p-1 text-right text-sm" />
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Discount</span>
                    <input type="number" step="0.01" {...register("discount", { valueAsNumber: true })} className="w-24 border rounded p-1 text-right text-sm" />
                </div>
                <div className="flex justify-between items-center text-xl font-bold pt-3 border-t">
                    <span>Total ({currency})</span>
                    <span>{calculatedTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
            <button type="submit" disabled={isLoading} className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isEditMode ? 'Update Invoice' : 'Create Invoice'}
            </button>
        </div>
    </form>
  );
}