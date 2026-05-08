import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateInvoiceSchema, type CreateInvoiceDTO, CURRENCIES, calculateInvoiceTotals } from "@erp/types";
import { api } from '../../../lib/axios';
import { AsyncSelect } from '../../../components/AsyncSelect';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { 
  Plus, Trash2, Loader2, Save, Calendar, ChevronRight, ChevronLeft, CheckCircle2, User, List, Eye
} from 'lucide-react';
import { clsx } from 'clsx';
import { Tooltip } from '../../../components/Tooltip';

interface InvoiceFormProps {
  initialValues?: Partial<CreateInvoiceDTO> & { clientName?: string };
  onSubmit: (data: CreateInvoiceDTO) => Promise<void>;
  isLoading: boolean;
  isEditMode?: boolean;
}

type FormStep = 'details' | 'items' | 'review';

const STEPS: { id: FormStep; label: string; icon: any }[] = [
  { id: 'details', label: 'Client Details', icon: User },
  { id: 'items', label: 'Line Items', icon: List },
  { id: 'review', label: 'Final Review', icon: Eye },
];

export function InvoiceForm({ initialValues, onSubmit, isLoading, isEditMode }: InvoiceFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<CreateInvoiceDTO>({
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

  // Fetch Exchange Rate when currency changes
  useEffect(() => {
    const updateExchangeRate = async () => {
      try {
        const { data: settingsData } = await api.get('/settings');
        const baseCurrency = settingsData.data?.currency || 'USD';
        setValue('baseCurrency', baseCurrency);
        
        if (currency === baseCurrency) {
          setValue('exchangeRate', 1);
          return;
        }

        const { data: ratesData } = await api.get(`/currency/rates?base=${baseCurrency}`);
        const rates = ratesData.data;
        if (rates && rates[currency]) {
          setValue('exchangeRate', rates[currency]);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
      }
    };

    updateExchangeRate();
  }, [currency, setValue]);

  // Calculations
  const { subTotal: calculatedSubTotal, taxTotal: calculatedTax, total: calculatedTotal } = calculateInvoiceTotals({
    items: items || [],
    taxRate: taxRate || 0,
    discount: discount || 0
  });

  // Data Fetchers
  const fetchClients = useCallback(async (q: string) => (await api.get(`/clients?search=${q}&limit=20`)).data.data, []);
  const fetchProducts = useCallback(async (q: string) => (await api.get(`/products?search=${q}&limit=20`)).data.data, []);

  // Load Settings
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

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 'details') fieldsToValidate = ['clientId', 'date', 'expiredDate'];
    if (currentStep === 'items') fieldsToValidate = ['items'];

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;

    if (currentStep === 'details') setCurrentStep('items');
    else if (currentStep === 'items') setCurrentStep('review');
  };

  const prevStep = () => {
    if (currentStep === 'review') setCurrentStep('items');
    else if (currentStep === 'items') setCurrentStep('details');
  };

  const submitHandler = (data: CreateInvoiceDTO) => {
    onSubmit({ 
        ...data, 
        subTotal: calculatedSubTotal, 
        taxTotal: calculatedTax, 
        total: calculatedTotal 
    });
  };

  useKeyboardShortcuts({
    'mod+s': (e) => {
      e.preventDefault();
      handleSubmit(submitHandler)();
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center max-w-2xl mx-auto mb-12">
            {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isPast = STEPS.findIndex(s => s.id === currentStep) > idx;

                return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <button 
                          type="button"
                          onClick={() => isPast && setCurrentStep(step.id)}
                          className="flex flex-col items-center group"
                        >
                            <div className={clsx(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
                                isActive ? "bg-black dark:bg-slate-100 border-black dark:border-slate-100 text-white dark:text-slate-900 shadow-xl shadow-black/10 dark:shadow-white/5 scale-110" : 
                                isPast ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500"
                            )}>
                                {isPast ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={clsx(
                                "text-[10px] font-black uppercase tracking-widest mt-3 transition-colors",
                                isActive ? "text-black dark:text-slate-100" : "text-gray-400 dark:text-slate-500"
                            )}>{step.label}</span>
                        </button>
                        {idx < STEPS.length - 1 && (
                            <div className={clsx(
                                "h-0.5 flex-1 mx-4 rounded-full transition-colors duration-500",
                                isPast ? "bg-emerald-100 dark:bg-emerald-500/30" : "bg-gray-100 dark:bg-slate-800"
                            )} />
                        )}
                    </div>
                );
            })}
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            
            {/* STEP 1: DETAILS */}
            {currentStep === 'details' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <AsyncSelect 
                                label="Select Client" 
                                id="clientId"
                                name="clientId"
                                placeholder="Start typing client name..." 
                                fetcher={fetchClients} 
                                renderOption={(c: { _id: string; name: string }) => c.name} 
                                getOptionLabel={(c: { _id: string; name: string }) => c.name}
                                onChange={(id) => setValue('clientId', id, { shouldValidate: true })} 
                                initialLabel={initialValues?.clientName} 
                                error={errors.clientId?.message}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="currency" className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Currency</label>
                                    <select 
                                        {...register("currency")} 
                                        id="currency"
                                        autoComplete="transaction-currency"
                                        className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-all font-medium text-gray-900 dark:text-slate-100"
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-6">
                                     <div className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                                          <input 
                                            type="checkbox" 
                                            id="isRecurring"
                                            className="w-5 h-5 text-black dark:text-slate-100 border-gray-300 dark:border-slate-700 rounded-lg focus:ring-black dark:focus:ring-white/10 bg-white dark:bg-slate-800"
                                            checked={watch("recurring") !== 'none'}
                                            onChange={(e) => setValue('recurring', e.target.checked ? 'monthly' : 'none')}
                                          />
                                          <label htmlFor="isRecurring" className="text-sm font-bold text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                                            Recurring
                                            <Tooltip content="Automatically generate a new invoice at regular intervals based on this one." />
                                          </label>
                                     </div>
                                </div>
                            </div>

                            {watch("recurring") !== 'none' && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <label htmlFor="recurring" className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Frequency</label>
                                    <select 
                                        {...register("recurring")} 
                                        id="recurring"
                                        className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium text-gray-900 dark:text-slate-100"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarter">Quarterly</option>
                                        <option value="annually">Annually</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="date" className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> Issued Date
                                    </label>
                                    <input 
                                        type="date" 
                                        id="date"
                                        autoComplete="off"
                                        {...register("date")} 
                                        className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-all font-medium text-gray-900 dark:text-slate-100" 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="expiredDate" className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> Due Date
                                    </label>
                                    <input 
                                        type="date" 
                                        id="expiredDate"
                                        autoComplete="off"
                                        {...register("expiredDate")} 
                                        className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-all font-medium text-gray-900 dark:text-slate-100" 
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="status" className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Status</label>
                                <select 
                                    {...register("status")} 
                                    id="status"
                                    className="w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-all font-medium text-gray-900 dark:text-slate-100"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: ITEMS */}
            {currentStep === 'items' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="overflow-visible -mx-10 px-10">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="pb-2 pl-4">Item & Description</th>
                                    <th className="pb-2 text-center w-24">Qty</th>
                                    <th className="pb-2 text-right w-40">Price</th>
                                    <th className="pb-2 text-right w-40">Total</th>
                                    <th className="pb-2 text-center w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="space-y-4">
                                {fields.map((field, index) => (
                                    <tr key={field.id} className="group transition-all">
                                        <td className="bg-gray-50 dark:bg-slate-800/50 rounded-l-2xl p-4 border-y border-l border-gray-100 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                                            <div className="space-y-2">
                                                <AsyncSelect 
                                                    label="Product"
                                                    id={`item-product-${index}`}
                                                    name={`items.${index}.productId`}
                                                    placeholder="Search product..." 
                                                    fetcher={fetchProducts} 
                                                    renderOption={(p: any) => (
                                                        <div className="flex justify-between items-center w-full">
                                                            <span className="font-bold">{p.name}</span>
                                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-black uppercase">{p.sku}</span>
                                                        </div>
                                                    )}
                                                    getOptionLabel={(p: any) => p.name}
                                                    onChange={(id) => handleProductSelect(index, id)}
                                                    initialLabel={fields[index].itemName}
                                                />
                                                <label htmlFor={`item-description-${index}`} className="sr-only">Description</label>
                                                <input 
                                                    {...register(`items.${index}.description`)} 
                                                    id={`item-description-${index}`}
                                                    placeholder="Optional description" 
                                                    autoComplete="off"
                                                    className="w-full text-xs bg-transparent border-0 outline-none text-gray-500 dark:text-slate-400 placeholder-gray-300 dark:placeholder-slate-600 italic"
                                                />
                                            </div>
                                        </td>
                                        <td className="bg-gray-50 dark:bg-slate-800/50 border-y border-gray-100 dark:border-slate-800 p-4">
                                            <label htmlFor={`item-quantity-${index}`} className="sr-only">Quantity</label>
                                            <input 
                                                type="number" 
                                                id={`item-quantity-${index}`}
                                                autoComplete="off"
                                                {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                                                className="w-full text-center bg-transparent font-bold text-gray-900 dark:text-slate-100 outline-none" 
                                            />
                                        </td>
                                        <td className="bg-gray-50 dark:bg-slate-800/50 border-y border-gray-100 dark:border-slate-800 p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-gray-400 dark:text-slate-500 font-bold">$</span>
                                                <label htmlFor={`item-price-${index}`} className="sr-only">Price</label>
                                                <input 
                                                    type="number" 
                                                    id={`item-price-${index}`}
                                                    step="0.01" 
                                                    autoComplete="off"
                                                    {...register(`items.${index}.price`, { valueAsNumber: true })} 
                                                    className="w-24 text-right bg-transparent font-bold text-gray-900 dark:text-slate-100 outline-none" 
                                                />
                                            </div>
                                        </td>
                                        <td className="bg-gray-50 dark:bg-slate-800/50 border-y border-gray-100 dark:border-slate-800 p-4 text-right font-black text-gray-900 dark:text-slate-100">
                                            ${((watch(`items.${index}.quantity`) || 0) * (watch(`items.${index}.price`) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="bg-gray-50 dark:bg-slate-800/50 rounded-r-2xl border-y border-r border-gray-100 dark:border-slate-800 p-4 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => remove(index)} 
                                                className="p-2 text-gray-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <button 
                        type="button" 
                        onClick={() => append({ itemName: '', quantity: 1, price: 0, total: 0 })}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 px-4 py-2 rounded-xl transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add Another Item
                    </button>
                </div>
            )}

            {/* STEP 3: REVIEW */}
            {currentStep === 'review' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Invoice Settings</h4>
                                <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Currency</span>
                                        <span className="font-bold text-gray-900 dark:text-slate-100">{watch("currency")}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="taxRate" className="text-sm text-gray-500 dark:text-slate-400 font-medium">Tax Rate</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                id="taxRate"
                                                step="0.01"
                                                autoComplete="off"
                                                {...register("taxRate", { valueAsNumber: true })} 
                                                className="w-16 text-right bg-transparent font-bold text-gray-900 dark:text-slate-100 outline-none border-b border-gray-200 dark:border-slate-700" 
                                            />
                                            <span className="text-gray-400 dark:text-slate-500 font-bold">%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="discount" className="text-sm text-gray-500 dark:text-slate-400 font-medium">Discount</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                id="discount"
                                                step="0.01"
                                                autoComplete="off"
                                                {...register("discount", { valueAsNumber: true })} 
                                                className="w-16 text-right bg-transparent font-bold text-gray-900 dark:text-slate-100 outline-none border-b border-gray-200 dark:border-slate-700" 
                                            />
                                            <span className="text-gray-400 dark:text-slate-500 font-bold">$</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="notes" className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 block">Notes & Instructions</label>
                                <textarea 
                                    {...register("notes")} 
                                    id="notes"
                                    rows={5}
                                    autoComplete="off"
                                    placeholder="Add any specific payment instructions or a thank you message..."
                                    className="w-full p-5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-sm text-gray-700 dark:text-slate-300 resize-none"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 h-fit">
                            <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">Summary</h4>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 font-medium">
                                    <span>Subtotal</span>
                                    <span className="text-gray-900 dark:text-slate-200">{formatCurrency(calculatedSubTotal, currency)}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 font-medium">
                                    <span>Tax ({watch("taxRate")}%)</span>
                                    <span className="text-gray-900 dark:text-slate-200">+{formatCurrency(calculatedTax, currency)}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 font-medium pb-5 border-b border-gray-200 dark:border-slate-800">
                                    <span>Discount</span>
                                    <span className="text-rose-600">-{formatCurrency(watch("discount") || 0, currency)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Total Amount</span>
                                    <span className="text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tighter">{formatCurrency(calculatedTotal, currency)}</span>
                                </div>
                            </div>
                            
                            <div className="mt-10 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed font-medium">
                                    By clicking create, this invoice will be saved as a {watch("status")} and can be sent to the client immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NAV ACTIONS */}
            <div className="flex justify-between items-center mt-12 pt-10 border-t border-gray-100 dark:border-slate-800">
                <button 
                    type="button" 
                    onClick={prevStep} 
                    disabled={currentStep === 'details'}
                    className="px-6 py-3 rounded-xl font-bold text-sm text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-200 disabled:opacity-0 transition-all flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                {currentStep === 'review' ? (
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-10 py-3.5 rounded-xl font-black text-sm hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-xl shadow-black/10 dark:shadow-white/5 disabled:opacity-50 flex items-center gap-3 active:scale-95"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {isEditMode ? 'Update Invoice' : 'Create Invoice'}
                    </button>
                ) : (
                    <button 
                        type="button" 
                        onClick={nextStep}
                        className="bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-lg flex items-center gap-2"
                    >
                        Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </form>
    </div>
  );
}

function formatCurrency(val: number, code: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(val);
}
