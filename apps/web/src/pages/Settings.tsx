import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsSchema, type SettingsDTO, CURRENCIES, PAYMENT_TERMS } from '@erp/types';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import {
    Settings as SettingsIcon, Save, Building, FileText, Lock,
    ChevronRight, Loader2,  Mail, Phone, MapPin, User, Upload, Palette, Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { user, updateUser } = useAuth();

  const isAdmin = user?.role === 'admin';

  const availableTabs = [
    { id: 'profile', label: 'My Profile', icon: User, description: 'Update your personal details' },
    ...(isAdmin ? [
        { id: 'general', label: 'Company Profile', icon: Building, description: 'Manage your business details' },
        { id: 'invoices', label: 'Invoice Defaults', icon: FileText, description: 'Set prefixes, terms, and notes' },
    ] : []),
    { id: 'security', label: 'Security', icon: Lock, description: 'Password and access controls' },
  ];

  // Users State (RBAC)
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'security' && user?.role === 'admin') {
        fetchUsers();
    }
  }, [activeTab, user]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
        const { data } = await api.get('/users');
        setUsers(data.data);
    } catch {
        toast.error("Failed to load users");
    } finally {
        setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
        await api.patch(`/users/${userId}/role`, { role: newRole });
        toast.success("Role updated");
        fetchUsers();
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
        await api.delete(`/users/${userId}`);
        toast.success("User deleted");
        fetchUsers();
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const { 
    register, 
    handleSubmit, 
    reset, 
    watch,
    setValue,
    formState: { errors, isSubmitting } 
  } = useForm<SettingsDTO>({
    resolver: zodResolver(SettingsSchema) as Resolver<SettingsDTO>,
  });

  const logoUrl = watch('logo');
  const primaryColor = watch('primaryColor') || '#2563EB';

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
        toast.success('Logo uploaded successfully');
      }
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors">
            <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <Loader2 className="animate-spin w-5 h-5 text-blue-600 dark:text-blue-400" /> 
                <span className="font-medium">Loading settings...</span>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 lg:p-10 transition-colors duration-200">
      <main className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Settings</h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm">Manage your workspace preferences</p>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 flex-shrink-0">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden sticky top-6">
                    <nav className="p-3 space-y-1">
                        {availableTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                                        isActive 
                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-500/20' 
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'}`} />
                                    <div>
                                        <div className="font-medium text-sm">{tab.label}</div>
                                        <div className={`text-xs ${isActive ? 'text-blue-400 dark:text-blue-500/60' : 'text-gray-400 dark:text-slate-500'}`}>{tab.description}</div>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-400 dark:text-blue-500" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 w-full">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                    
                    {/* MY PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">My Profile</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Update your personal information.</p>
                            </div>
                            
                            <form onSubmit={handleProfileUpdate} className="p-8 max-w-lg mx-auto">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Full Name</label>
                                        <input 
                                            type="text" 
                                            id="full-name"
                                            autoComplete="name"
                                            value={profileData.name}
                                            onChange={e => setProfileData({...profileData, name: e.target.value})}
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email-address"
                                            autoComplete="email"
                                            value={profileData.email}
                                            onChange={e => setProfileData({...profileData, email: e.target.value})}
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            type="submit" 
                                            disabled={profileLoading}
                                            className="w-full bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {profileLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            {profileLoading ? 'Saving...' : 'Save Profile'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'general' && isAdmin && (
                        <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Company Profile</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">This information will appear on your invoices.</p>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Logo Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                            <Upload className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                            Company Logo
                                        </label>
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                                {logoUrl ? (
                                                    <img src={`${api.defaults.baseURL?.replace('/api/v1', '')}${logoUrl}`} alt="Logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Building className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                                                )}
                                            </div>
                                            <label className="cursor-pointer bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2">
                                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                Change Logo
                                                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Brand Color */}
                                    <div>
                                        <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                            <Palette className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                            Brand Color
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="color" 
                                                id="primaryColor"
                                                {...register('primaryColor')}
                                                className="w-12 h-12 rounded-lg border-0 p-0 cursor-pointer bg-transparent"
                                            />
                                            <div className="flex-1">
                                                <input 
                                                    type="text" 
                                                    id="primaryColorText"
                                                    value={primaryColor}
                                                    onChange={(e) => setValue('primaryColor', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-mono text-sm text-gray-900 dark:text-slate-100"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2 italic">This color will be used for PDF accents and buttons.</p>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Company Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
                                        <input {...register('companyName')} id="companyName" autoComplete="organization" className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" placeholder="Acme Inc." />
                                    </div>
                                    {errors.companyName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.companyName.message}</p>}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
                                            <input {...register('companyEmail')} id="companyEmail" type="email" autoComplete="email" className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" placeholder="billing@acme.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
                                            <input {...register('companyPhone')} id="companyPhone" type="tel" autoComplete="tel" className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" placeholder="+1 (555) 000-0000" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Mailing Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-slate-500" />
                                        <textarea {...register('companyAddress')} id="companyAddress" autoComplete="street-address" rows={3} className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" placeholder="123 Innovation Dr, Tech City, CA" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                                    <div>
                                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Default Currency</label>
                                        <select {...register('currency')} id="currency" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100">
                                            {CURRENCIES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Default Tax Rate (%)</label>
                                        <input type="number" id="taxRate" step="0.01" {...register('taxRate', { valueAsNumber: true })} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100" />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* --- INVOICES TAB --- */}
                    {activeTab === 'invoices' && isAdmin && (
                        <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Invoice Defaults</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Configure how your invoices look and behave.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Invoice Prefix</label>
                                        <div className="flex rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
                                            <span className="inline-flex items-center px-3 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-sm font-mono border-r border-gray-200 dark:border-slate-700">#</span>
                                            <input {...register('invoicePrefix')} className="flex-1 min-w-0 block w-full px-3 py-2 bg-white dark:bg-slate-900 outline-none focus:bg-blue-50 dark:focus:bg-blue-900/10 transition-colors text-gray-900 dark:text-slate-100" placeholder="INV-" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Next Invoice #</label>
                                        <input 
                                            type="number" 
                                            {...register('invoiceStartNumber', { valueAsNumber: true })} 
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" 
                                            placeholder="1000"
                                        />
                                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 ml-1">Only applies if no invoices exist yet.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Payment Terms</label>
                                        <select {...register('defaultPaymentTerms', { valueAsNumber: true })} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100">
                                            {PAYMENT_TERMS.map((term) => (
                                                <option key={term.value} value={term.value}>{term.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Default Footer Notes</label>
                                    <textarea {...register('defaultNotes')} rows={4} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500" placeholder="Payment details, thank you notes..." />
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* --- SECURITY TAB --- */}
                    {activeTab === 'security' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Security {isAdmin && '& Team'}</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Manage your password {isAdmin && 'and team access'}.</p>
                            </div>
                            
                            <div className="p-8 space-y-12">
                                {/* User Management (RBAC) */}
                                {user?.role === 'admin' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Team Management</h3>
                                            <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-500/20">{users.length} Users</span>
                                        </div>

                                        <div className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-gray-50/30 dark:bg-slate-800/30">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">
                                                    <tr>
                                                        <th className="px-6 py-3">User</th>
                                                        <th className="px-6 py-3">Role</th>
                                                        <th className="px-6 py-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                                    {usersLoading ? (
                                                        <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500 italic">Loading users...</td></tr>
                                                    ) : users.map((u) => (
                                                        <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="font-semibold text-gray-900 dark:text-slate-100">{u.name}</div>
                                                                <div className="text-xs text-gray-500 dark:text-slate-400">{u.email}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <select 
                                                                    value={u.role} 
                                                                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                                    disabled={u._id === user?.id}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none transition-all ${
                                                                        u.role === 'admin' 
                                                                        ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/20' 
                                                                        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                                                                    } disabled:opacity-50`}
                                                                >
                                                                    <option value="user">USER</option>
                                                                    <option value="admin">ADMIN</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button 
                                                                    onClick={() => handleDeleteUser(u._id)}
                                                                    disabled={u._id === user?.id}
                                                                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-0"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Password Change Section */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Change Password</h3>
                                    <div className="max-w-md bg-gray-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                                        <form onSubmit={handlePasswordChange} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Current Password</label>
                                                <input 
                                                    type="password" 
                                                    value={passData.oldPassword}
                                                    onChange={e => setPassData({...passData, oldPassword: e.target.value})}
                                                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">New Password</label>
                                                <input 
                                                    type="password" 
                                                    value={passData.newPassword}
                                                    onChange={e => setPassData({...passData, newPassword: e.target.value})}
                                                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={passLoading}
                                                className="w-full bg-blue-600 dark:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {passLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                Update Password
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
