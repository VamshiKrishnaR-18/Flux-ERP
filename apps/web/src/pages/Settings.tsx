import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsSchema, type SettingsDTO, CURRENCIES, PAYMENT_TERMS } from '@erp/types';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { 
    Settings as SettingsIcon, Save, Building, FileText, Lock, 
    ChevronRight, Loader2,  Mail, Phone, MapPin, User 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const TABS = [
    { id: 'profile', label: 'My Profile', icon: User, description: 'Update your personal details' },
    { id: 'general', label: 'Company Profile', icon: Building, description: 'Manage your business details' },
    { id: 'invoices', label: 'Invoice Defaults', icon: FileText, description: 'Set prefixes, terms, and notes' },
    { id: 'security', label: 'Security', icon: Lock, description: 'Password and access controls' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const { user, updateUser } = useAuth();

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors, isSubmitting } 
  } = useForm<SettingsDTO>({
    resolver: zodResolver(SettingsSchema) as Resolver<SettingsDTO>,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.data) {
            reset(res.data.data);
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: SettingsDTO) => {
    try {
      await api.put('/settings', data);
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  // Password Change Logic
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '' });
  const [passLoading, setPassLoading] = useState(false);

  //  Profile Update Logic
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) {
        setProfileData({ name: user.name, email: user.email });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name || !profileData.email) {
        toast.error("Name and Email are required");
        return;
    }
    setProfileLoading(true);
    try {
        const { data } = await api.put('/auth/profile', profileData);
        if (data.success) {
            updateUser(data.data);
            toast.success("Profile updated successfully");
        }
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
        setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passData.oldPassword || !passData.newPassword) {
        toast.error("Please fill in all fields");
        return;
    }
    setPassLoading(true);
    try {
        await api.post('/auth/change-password', passData);
        toast.success("Password updated successfully");
        setPassData({ oldPassword: '', newPassword: '' });
    } catch {
        toast.error("Failed to update password");
    } finally {
        setPassLoading(false);
    }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex items-center gap-3 text-gray-500 bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100">
                <Loader2 className="animate-spin w-5 h-5 text-blue-600" /> 
                <span className="font-medium">Loading settings...</span>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <main className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <SettingsIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500 text-sm">Manage your workspace preferences</p>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                    <nav className="p-3 space-y-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                                        isActive 
                                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <div>
                                        <div className="font-medium text-sm">{tab.label}</div>
                                        <div className={`text-xs ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>{tab.description}</div>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content Form */}
            <div className="flex-1 w-full">
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    {/* MY PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-semibold text-gray-900">My Profile</h2>
                                <p className="text-sm text-gray-500">Update your personal information.</p>
                            </div>
                            
                            <div className="p-8 max-w-lg mx-auto">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={profileData.name}
                                            onChange={e => setProfileData({...profileData, name: e.target.value})}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={profileData.email}
                                            onChange={e => setProfileData({...profileData, email: e.target.value})}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            type="button" 
                                            onClick={handleProfileUpdate}
                                            disabled={profileLoading}
                                            className="w-full bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {profileLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            {profileLoading ? 'Saving...' : 'Save Profile'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'general' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
                                <p className="text-sm text-gray-500">This information will appear on your invoices.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <input {...register('companyName')} className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Acme Inc." />
                                    </div>
                                    {errors.companyName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.companyName.message}</p>}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input {...register('companyEmail')} className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="billing@acme.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input {...register('companyPhone')} className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+1 (555) 000-0000" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mailing Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <textarea {...register('companyAddress')} rows={3} className="w-full pl-9 pr-4 py-2 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none" placeholder="123 Innovation Dr, Tech City, CA" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Currency</label>
                                        <select {...register('currency')} className="w-full px-4 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                            {CURRENCIES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Tax Rate (%)</label>
                                        <input type="number" step="0.01" {...register('taxRate', { valueAsNumber: true })} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- INVOICES TAB --- */}
                    {activeTab === 'invoices' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-semibold text-gray-900">Invoice Defaults</h2>
                                <p className="text-sm text-gray-500">Configure how your invoices look and behave.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Prefix</label>
                                        <div className="flex rounded-xl shadow-sm overflow-hidden border border-gray-200">
                                            <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 text-sm font-mono border-r border-gray-200">#</span>
                                            <input {...register('invoicePrefix')} className="flex-1 min-w-0 block w-full px-3 py-2 outline-none focus:bg-blue-50 transition-colors" placeholder="INV-" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Invoice #</label>
                                        <input 
                                            type="number" 
                                            {...register('invoiceStartNumber', { valueAsNumber: true })} 
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                            placeholder="1000"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1.5 ml-1">Only applies if no invoices exist yet.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                                        <select {...register('defaultPaymentTerms', { valueAsNumber: true })} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                            {PAYMENT_TERMS.map((term) => (
                                                <option key={term.value} value={term.value}>{term.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Footer Notes</label>
                                    <textarea {...register('defaultNotes')} rows={4} className="w-full px-4 py-3 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Payment details, thank you notes..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SECURITY TAB --- */}
                    {activeTab === 'security' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-semibold text-gray-900">Security & Access</h2>
                                <p className="text-sm text-gray-500">Manage your account security.</p>
                            </div>
                            
                            <div className="p-8 max-w-lg mx-auto">
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                                        <input 
                                            type="password" 
                                            value={passData.oldPassword}
                                            onChange={e => setPassData({...passData, oldPassword: e.target.value})}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                        <input 
                                            type="password" 
                                            value={passData.newPassword}
                                            onChange={e => setPassData({...passData, newPassword: e.target.value})}
                                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            type="submit" 
                                            disabled={passLoading}
                                            className="w-full bg-black text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {passLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                            {passLoading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    {activeTab !== 'security' && activeTab !== 'profile' && (
                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-black text-white px-8 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
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
