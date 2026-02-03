import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsSchema, type SettingsDTO } from '@erp/types';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { 
    Settings as SettingsIcon, Save, Building, FileText, Lock, 
    ChevronRight 
} from 'lucide-react';

// Tabs Configuration
const TABS = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'security', label: 'Security', icon: Lock },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);

  // Form Setup
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SettingsDTO>({
    resolver: zodResolver(SettingsSchema) as any,
  });

  // Load Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.data) {
            reset(res.data.data);
        }
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  // Save Handler
  const onSubmit = async (data: SettingsDTO) => {
    try {
      await api.put('/settings', data);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <main className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                <SettingsIcon className="w-6 h-6 text-gray-700" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your workspace preferences</p>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* LEFT SIDEBAR (Tabs) */}
            <aside className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <nav className="p-2 space-y-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                        isActive 
                                        ? 'bg-gray-100 text-gray-900' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {tab.label}
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* RIGHT CONTENT (Forms) */}
            <div className="flex-1">
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'general' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
                                <p className="text-sm text-gray-500">Update your company details and address.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <input {...register('companyName')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Acme Inc." />
                                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input {...register('companyEmail')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input {...register('companyPhone')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                                    <textarea {...register('companyAddress')} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                        <select {...register('currency')} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                            <option value="USD">🇺🇸 USD ($)</option>
                                            <option value="EUR">🇪🇺 EUR (€)</option>
                                            <option value="GBP">🇬🇧 GBP (£)</option>
                                            <option value="INR">🇮🇳 INR (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                                        <input type="number" step="0.01" {...register('taxRate', { valueAsNumber: true })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- INVOICES TAB --- */}
                    {activeTab === 'invoices' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Invoice Settings</h2>
                                <p className="text-sm text-gray-500">Configure default behavior for new invoices.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                                        <div className="flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">#</span>
                                            <input {...register('invoicePrefix')} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border focus:ring-blue-500 focus:border-blue-500" placeholder="INV-" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Terms</label>
                                        <select {...register('defaultPaymentTerms', { valueAsNumber: true })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                            <option value={0}>Due on Receipt</option>
                                            <option value={7}>Net 7 Days</option>
                                            <option value={14}>Net 14 Days</option>
                                            <option value={30}>Net 30 Days</option>
                                            <option value={60}>Net 60 Days</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Footer Notes</label>
                                    <textarea {...register('defaultNotes')} rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Thank you for your business..." />
                                    <p className="mt-2 text-xs text-gray-500">This text will appear at the bottom of every new invoice PDF.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SECURITY TAB (Placeholder for now) --- */}
                    {activeTab === 'security' && (
                        <div className="animate-in fade-in duration-300">
                             <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                                <p className="text-sm text-gray-500">Manage your password and access.</p>
                            </div>
                            <div className="p-12 text-center">
                                <div className="bg-gray-50 inline-block p-4 rounded-full mb-4">
                                    <Lock className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-gray-900 font-medium mb-1">Change Password</h3>
                                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                                    Secure your account by updating your password regularly. This feature requires backend API updates.
                                </p>
                                <button type="button" className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 bg-blue-50 px-4 py-2 rounded-lg">
                                    Update Password (Coming Soon)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    {activeTab !== 'security' && (
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                </form>
            </div>
        </div>
      </main>
    </div>
  );
}