import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, FileText, TrendingUp, TrendingDown, ArrowRight, Activity, Users, Plus, Calendar
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Invoice } from '@erp/types';
import { CardSkeleton, Skeleton } from '../components/Skeleton';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { DashboardCustomizeModal } from '../features/dashboard/components/DashboardCustomizeModal';
import { Settings as SettingsIcon, Lightbulb, Sparkles, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingWizard } from '../features/onboarding/components/OnboardingWizard';

type MoneyBucket = { amount: number; count: number };

type DashboardStats = {
	totalRevenue: number;
	totalExpenses: number;
	netProfit: number;
	totalInvoices: number;
	pendingAmount: number;
	totalClients: number;
	recentInvoices: Invoice[];
	chartData: { name: string; income: number; expense: number }[];
	revenueTrend: number;
	expenseTrend: number;
	profitTrend: number;
	invoiceAging?: {
		current: MoneyBucket;
		overdue1_30: MoneyBucket;
		overdue31_60: MoneyBucket;
		overdue61_90: MoneyBucket;
		overdue90_plus: MoneyBucket;
	};
	overdueAmount?: number;
	overdueCount?: number;
	topClients?: { clientId: string; name?: string; revenue: number; invoiceCount: number; outstanding: number }[];
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateDashboardConfig } = useAuth();
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  const dashboardConfig = user?.dashboardConfig || ["stats", "cashflow", "aging", "recentInvoices", "topClients"];
  const showWidget = (id: string) => dashboardConfig.includes(id);

  const { data: statsData, isLoading: loading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data.data;
    }
  });

  const stats = statsData as DashboardStats | null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const revenueTrend = stats?.revenueTrend || 0;
  const isPositiveRevenueTrend = revenueTrend >= 0;
	const formatMoney = (value: number) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

	const aging = stats?.invoiceAging;
	const topClients = stats?.topClients || [];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const getClientName = (clientId: Invoice['clientId']) => (clientId as { name?: string })?.name || 'Unknown Client';

  const getInsights = () => {
    if (!stats) return [];
    const insights = [];
    
    if (Math.abs(stats.revenueTrend) > 5) {
      insights.push({
        text: `Revenue is ${stats.revenueTrend > 0 ? 'up' : 'down'} ${Math.abs(stats.revenueTrend).toFixed(1)}% compared to last month.`,
        type: stats.revenueTrend > 0 ? 'positive' : 'negative'
      });
    }

    if (stats.expenseTrend > 10) {
      insights.push({
        text: `Expenses have increased by ${stats.expenseTrend.toFixed(1)}% this month. Consider reviewing your costs.`,
        type: 'negative'
      });
    }

    if (stats.profitTrend > 0 && stats.revenueTrend > 0) {
      insights.push({
        text: "Great job! Both revenue and profit margins are improving this month.",
        type: 'positive'
      });
    }

    if ((stats.overdueCount || 0) > 0) {
      insights.push({
        text: `You have ${stats.overdueCount} overdue invoices totaling ${formatMoney(stats.overdueAmount || 0)}.`,
        type: 'warning'
      });
    }

    return insights;
  };

  const insights = getInsights();

  const { data: aiInsightsData, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      try {
        const res = await api.get('/ai/insights');
        return res.data?.data?.insights || res.data?.insights || "No insights available at the moment.";
      } catch (error) {
        console.error("AI Insights fetch failed:", error);
        return "Failed to load AI insights. Please check your API key or try again later.";
      }
    },
    staleTime: 1000 * 60 * 15, // 15 mins
    retry: 1
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/30 dark:bg-slate-950 transition-colors duration-200">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm mb-2 font-medium">
                <Calendar className="w-4 h-4" />
                {today}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Welcome back, here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="text-right hidden sm:block mr-2">
                 <p className="text-xs text-gray-400 dark:text-slate-500 mb-1 font-bold uppercase tracking-widest">MoM Growth</p>
                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${isPositiveRevenueTrend ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                    {isPositiveRevenueTrend ? <TrendingUp className="w-3.5 h-3.5 mr-1.5 stroke-[3]"/> : <TrendingDown className="w-3.5 h-3.5 mr-1.5 stroke-[3]"/>}
                    {Math.abs(revenueTrend).toFixed(1)}%
                 </span>
            </div>
            <button 
                onClick={() => setIsCustomizeModalOpen(true)}
                className="flex-1 md:flex-none p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                title="Customize Dashboard"
                aria-label="Customize Dashboard"
            >
                <SettingsIcon className="w-5 h-5 mx-auto" />
            </button>
            <button 
                onClick={() => navigate('/invoices/new')}
                className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-xl shadow-black/5 dark:shadow-white/5 active:scale-[0.98]"
            >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New Invoice</span>
            </button>
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BrainCircuit size={160} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Flux AI Advisor</h2>
            </div>

            {aiLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
                <div className="h-4 bg-white/10 rounded-full w-1/2 animate-pulse" />
              </div>
            ) : (
              <div className="prose prose-invert max-w-none prose-sm max-h-[200px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40 transition-colors">
                <ReactMarkdown>{aiInsightsData}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {!loading && insights.length > 0 && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <Lightbulb className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100/50 dark:border-slate-800/50">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    insight.type === 'positive' ? 'bg-emerald-500' : 
                    insight.type === 'negative' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 leading-snug">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {showWidget('stats') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <StatCard 
                title={t('dashboard.revenue')} 
                value={formatMoney(stats?.totalRevenue || 0)} 
                icon={DollarSign} 
                iconColor="text-emerald-600"
                bgColor="bg-emerald-500/10"
                trend={`${Math.abs(stats?.revenueTrend || 0).toFixed(1)}%`}
                trendUp={(stats?.revenueTrend || 0) >= 0}
            />
            <StatCard 
                title={t('dashboard.profit')} 
                value={formatMoney(stats?.netProfit || 0)} 
                icon={Activity} 
                iconColor="text-indigo-600"
                bgColor="bg-indigo-500/10"
                trend={`${Math.abs(stats?.profitTrend || 0).toFixed(1)}%`}
                trendUp={(stats?.profitTrend || 0) >= 0}
            />
            <StatCard 
                title={t('dashboard.expenses')} 
                value={formatMoney(stats?.totalExpenses || 0)} 
                icon={TrendingDown} 
                iconColor="text-rose-600"
                bgColor="bg-rose-500/10"
                trend={`${Math.abs(stats?.expenseTrend || 0).toFixed(1)}%`}
                trendUp={(stats?.expenseTrend || 0) <= 0} // For expenses, trendUp is true if expenses are DOWN
            />
            <StatCard 
                title={t('dashboard.outstanding')} 
                value={formatMoney(stats?.pendingAmount || 0)} 
                icon={FileText} 
                iconColor="text-amber-600"
                bgColor="bg-amber-500/10"
                trend="Overdue"
                trendUp={false}
            />
            </>
          )}
        </div>
      )}

      {(showWidget('cashflow') || showWidget('aging')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Main Chart */}
          {showWidget('cashflow') && (
            <div className={`${showWidget('aging') ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100/80 dark:border-slate-800`}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Cash Flow</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Monthly income vs expenses tracking</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Income
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expense
                        </div>
                    </div>
                </div>
                <div className="h-80 w-full min-h-[320px]"> 
                    {loading ? (
                      <Skeleton className="w-full h-full rounded-2xl" />
                    ) : isMounted && (
                        <ErrorBoundary>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart 
                                    className="cursor-pointer"
                                    data={stats?.chartData || []} 
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    onClick={(data) => {
                                        if (data && data.activeLabel) {
                                            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                            const monthIndex = monthNames.indexOf(String(data.activeLabel));
                                            if (monthIndex !== -1) {
                                                const month = monthIndex + 1;
                                                const year = new Date().getFullYear();
                                                navigate(`/invoices?month=${month}&year=${year}`);
                                            }
                                        }
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f3f4f6'} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: theme === 'dark' ? '#64748b' : '#9ca3af', fontSize: 12, fontWeight: 500}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: theme === 'dark' ? '#64748b' : '#9ca3af', fontSize: 12, fontWeight: 500}}
                                        tickFormatter={(value) => `$${value/1000}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '16px', 
                                            border: 'none', 
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                            color: theme === 'dark' ? '#f1f5f9' : '#111827',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                            padding: '16px'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#111827' }}
                                        cursor={{ stroke: theme === 'dark' ? '#334155' : '#e5e7eb', strokeWidth: 1 }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="income" 
                                        name="Income" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorIncome)" 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="expense" 
                                        name="Expense" 
                                        stroke="#f43f5e" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorExpense)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    )}
                </div>
            </div>
          )}

          {/* Invoice Aging */}
          {showWidget('aging') && (
            <div className={`${showWidget('cashflow') ? '' : 'lg:col-span-3'} bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100/80 dark:border-slate-800 flex flex-col`}>
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Invoice Aging</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Unpaid invoices by due date</p>
                </div>
                
                <div className="flex-1 flex flex-col justify-center space-y-5">
                    {loading ? (
                      <>
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                      </>
                    ) : (
                      <>
                        <AgingRow label="Current" bucket={aging?.current} color="bg-emerald-500" />
                        <AgingRow label="1–30 Days Overdue" bucket={aging?.overdue1_30} color="bg-amber-500" />
                        <AgingRow label="31–60 Days Overdue" bucket={aging?.overdue31_60} color="bg-orange-500" />
                        <AgingRow label="61–90 Days Overdue" bucket={aging?.overdue61_90} color="bg-rose-500" />
                        <AgingRow label="90+ Days Overdue" bucket={aging?.overdue90_plus} color="bg-red-600" />
                      </>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                         <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">Outstanding</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{formatMoney(stats?.pendingAmount || 0)}</p>
                         </div>
                         <button onClick={() => navigate('/invoices')} className="px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all">
                            Details
                         </button>
                    </div>
                </div>
            </div>
          )}

        </div>
      )}

      {(showWidget('recentInvoices') || showWidget('topClients')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Invoices */}
          {showWidget('recentInvoices') && (
            <div className={`${showWidget('topClients') ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100/80 dark:border-slate-800`}>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Recent Invoices</h2>
                    <button onClick={() => navigate('/invoices')} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 group">
                        View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                      <div className="space-y-4 py-4">
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <Skeleton className="h-14 w-full rounded-xl" />
                      </div>
                    ) : (
                      <>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-slate-800">
                                    <th className="pb-4 pl-2">Invoice</th>
                                    <th className="pb-4">Client</th>
                                    <th className="pb-4">Date</th>
                                    <th className="pb-4 text-right">Amount</th>
                                    <th className="pb-4 text-right pr-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {(stats?.recentInvoices || []).slice(0, 5).map((inv: Invoice) => (
                                    <tr key={inv._id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer" onClick={() => navigate(`/invoices/${inv._id}`)}>
                                        <td className="py-5 pl-2 font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">#{inv.number}</td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-gray-500 dark:text-slate-400 shrink-0 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors border border-transparent group-hover:border-gray-100 dark:group-hover:border-slate-600">
                                                    {getInitials(getClientName(inv.clientId))}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 truncate max-w-[140px]" title={getClientName(inv.clientId)}>
                                                    {getClientName(inv.clientId) || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 text-sm text-gray-500 dark:text-slate-400 font-medium">
                                            {new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="py-5 text-right font-black text-gray-900 dark:text-slate-100">
                                            ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-5 text-right pr-2">
                                            <StatusBadge status={inv.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
                            <div className="text-center py-16">
                                <p className="text-gray-400 dark:text-slate-500 font-medium mb-6">No recent invoices found.</p>
                                <button onClick={() => navigate('/invoices/new')} className="bg-black dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm">Create First Invoice</button>
                            </div>
                        )}
                      </>
                    )}
                </div>
            </div>
          )}

          {/* Top Clients */}
          {showWidget('topClients') && (
            <div className={`${showWidget('recentInvoices') ? '' : 'lg:col-span-3'} bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100/80 dark:border-slate-800`}>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Top Clients</h2>
                    <Users className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                </div>
                <div className="space-y-6">
                    {loading ? (
                      <>
                        <div className="flex items-center justify-between py-2"><Skeleton className="h-12 w-full rounded-xl" /></div>
                        <div className="flex items-center justify-between py-2"><Skeleton className="h-12 w-full rounded-xl" /></div>
                        <div className="flex items-center justify-between py-2"><Skeleton className="h-12 w-full rounded-xl" /></div>
                        <div className="flex items-center justify-between py-2"><Skeleton className="h-12 w-full rounded-xl" /></div>
                        <div className="flex items-center justify-between py-2"><Skeleton className="h-12 w-full rounded-xl" /></div>
                      </>
                    ) : (
                      <>
                        {topClients.slice(0, 5).map((c, i) => (
                            <div 
                                key={c.clientId} 
                                onClick={() => navigate(`/clients/${c.clientId}`)}
                                className="flex items-center justify-between group p-3 -mx-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer gap-4"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm ${
                                        i === 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 
                                        i === 1 ? 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300' : 
                                        i === 2 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400' : 
                                        'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                                    }`}>
                                        {getInitials(c.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-slate-100 truncate" title={c.name}>{c.name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">{c.invoiceCount} invoices</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-sm text-gray-900 dark:text-slate-100">{formatMoney(c.revenue)}</p>
                                    {c.outstanding > 0 ? (
                                        <p className="text-[10px] text-rose-500 font-black uppercase mt-1">Due: {formatMoney(c.outstanding)}</p>
                                    ) : (
                                        <p className="text-[10px] text-emerald-500 font-black uppercase mt-1 tracking-widest">Settled</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {topClients.length === 0 && (
                             <div className="text-center py-12 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">No client data yet.</p>
                            </div>
                        )}
                      </>
                    )}
                </div>
                <button 
                    onClick={() => navigate('/clients')}
                    className="w-full mt-8 py-3 rounded-xl border border-gray-100 dark:border-slate-800 text-sm font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 transition-all"
                >
                    View All Clients
                </button>
            </div>
          )}

        </div>
      )}

      <DashboardCustomizeModal 
        isOpen={isCustomizeModalOpen} 
        onClose={() => setIsCustomizeModalOpen(false)} 
        currentConfig={dashboardConfig}
        onSave={updateDashboardConfig}
      />

      {shouldShowOnboarding && (
        <OnboardingWizard onComplete={completeOnboarding} />
      )}
    </div>
  );
}

// --- Helper Components ---

function StatCard({ title, value, icon: Icon, iconColor, bgColor, trend, trendUp }: { 
    title: string; value: string; icon: LucideIcon; iconColor: string; bgColor: string; trend?: string; trendUp?: boolean 
}) {
    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-6">
                <div className={`p-3.5 rounded-2xl ${bgColor} ${iconColor} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                {trend && (
                    <span className={`flex items-center text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        trendUp ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                        {trendUp ? <TrendingUp className="w-3 h-3 mr-1 stroke-[3]" /> : <TrendingDown className="w-3 h-3 mr-1 stroke-[3]" />}
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}

function AgingRow({ label, bucket, color }: { label: string; bucket?: { amount: number; count: number }; color: string }) {
    const amount = bucket?.amount || 0;
    const count = bucket?.count || 0;
    const max = 10000;
    const percent = Math.min((amount / max) * 100, 100);

    return (
        <div className="group">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                <div className="text-right">
                    <span className="text-sm font-black text-gray-900 dark:text-slate-100">${amount.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 ml-2 uppercase">({count})</span>
                </div>
            </div>
            <div className="h-2.5 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden border border-gray-100/50 dark:border-slate-800/50 p-0.5">
                <div 
                    className={`h-full ${color} rounded-full transition-all duration-700 ease-out`} 
                    style={{ width: `${Math.max(percent, count > 0 ? 5 : 0)}%` }}
                />
            </div>
        </div>
    );
}

function getInitials(name?: string) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
