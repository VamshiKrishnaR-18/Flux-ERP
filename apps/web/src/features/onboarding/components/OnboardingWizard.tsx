import React, { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsSchema, type SettingsDTO, CURRENCIES } from '@erp/types';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';
import { 
  Building, Mail, Phone, MapPin, Upload, 
  ChevronRight, ChevronLeft, Check, Loader2, Rocket
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue,
    formState: { errors } 
  } = useForm<SettingsDTO>({
    resolver: zodResolver(SettingsSchema) as Resolver<SettingsDTO>,
    defaultValues: {
      primaryColor: '#2563EB',
      currency: 'USD',
      taxRate: 0,
      invoicePrefix: 'INV-',
      invoiceStartNumber: 1000,
      defaultPaymentTerms: 30
    }
  });

  const logoUrl = watch('logo');
  const primaryColor = watch('primaryColor');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setValue('logo', data.data.url);
        toast.success('Logo uploaded!');
      }
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: SettingsDTO) => {
    setIsSubmitting(true);
    try {
      await api.put('/settings', data);
      toast.success("Setup completed! Welcome aboard.");
      onComplete();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-slate-800">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 flex">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`h-full transition-all duration-500 flex-1 ${
                i <= step ? 'bg-blue-600' : 'bg-transparent'
              }`} 
            />
          ))}
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
                <Rocket className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-slate-100 mb-4 tracking-tight">Welcome to Flux ERP!</h1>
              <p className="text-lg text-gray-500 dark:text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
                Let&apos;s get your business set up in just a few minutes. This information will be used for your invoices and quotes.
              </p>
              <button 
                onClick={nextStep}
                className="w-full bg-black dark:bg-slate-100 text-white dark:text-slate-900 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-xl shadow-black/10 active:scale-95"
              >
                Let&apos;s Get Started
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2 tracking-tight">Company Details</h2>
                <p className="text-gray-500 dark:text-slate-400">Basic information about your business.</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Company Name</label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      {...register('companyName')}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-gray-900 dark:text-slate-100" 
                      placeholder="Acme Inc." 
                    />
                  </div>
                  {errors.companyName && <p className="text-rose-500 text-xs mt-2 font-semibold ml-1">{errors.companyName.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input {...register('companyEmail')} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none text-gray-900 dark:text-slate-100" placeholder="hello@acme.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Phone</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input {...register('companyPhone')} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none text-gray-900 dark:text-slate-100" placeholder="+1 234 567 890" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Address</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <textarea {...register('companyAddress')} rows={3} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none text-gray-900 dark:text-slate-100 resize-none" placeholder="123 Street Name, City, Country" />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  onClick={nextStep} 
                  disabled={!watch('companyName')}
                  className="flex-[2] bg-black dark:bg-slate-100 text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2 tracking-tight">Branding</h2>
                <p className="text-gray-500 dark:text-slate-400">Make your invoices look professional.</p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-4 ml-1">Logo</label>
                  <div className="flex items-center gap-8 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
                      {logoUrl ? (
                        <img src={`${api.defaults.baseURL?.replace('/api/v1', '')}${logoUrl}`} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Building className="w-8 h-8 text-gray-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-3 font-medium">PNG, JPG or SVG. Max 2MB.</p>
                      <label className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {logoUrl ? 'Change Logo' : 'Upload Logo'}
                        <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-4 ml-1">Brand Color</label>
                  <div className="flex items-center gap-6 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                    <div 
                      className="w-16 h-16 rounded-2xl shadow-xl border-4 border-white dark:border-slate-700 shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={primaryColor}
                          onChange={(e) => setValue('primaryColor', e.target.value)}
                          className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer bg-transparent shrink-0"
                        />
                        <input 
                          type="text" 
                          value={primaryColor}
                          onChange={(e) => setValue('primaryColor', e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-mono text-sm text-gray-900 dark:text-slate-100"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2 font-medium">This color will be used for buttons and highlights on PDFs.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  onClick={nextStep} 
                  className="flex-[2] bg-black dark:bg-slate-100 text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2 tracking-tight">Financial Defaults</h2>
                <p className="text-gray-500 dark:text-slate-400">Settings for your billing process.</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Currency</label>
                    <select 
                      {...register('currency')}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none text-gray-900 dark:text-slate-100 font-medium"
                    >
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Default Tax Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      {...register('taxRate', { valueAsNumber: true })}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none text-gray-900 dark:text-slate-100" 
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-500/5 p-6 rounded-3xl border border-blue-100/50 dark:border-blue-500/10">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-1">Ready to launch?</h4>
                      <p className="text-xs text-blue-700/70 dark:text-blue-400/70 leading-relaxed font-medium">
                        You can always change these settings later in the Settings page. Once you click complete, you can start creating your first invoice!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
