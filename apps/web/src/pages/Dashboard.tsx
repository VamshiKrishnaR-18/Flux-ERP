import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, FileText, TrendingUp, TrendingDown, ArrowRight, Activity, Loader2, Users, Plus, Calendar
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Invoice } from '@erp/types';

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
	trendPercentage: number;
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
  const navigate = useNavigate();
	const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

	  useEffect(() => {
	    api.get('/dashboard')
	      .then(res => setStats(res.data.data))
	      .catch(err => console.error("Dashboard Load Error:", err))
	      .finally(() => setLoading(false));
	  }, []);

	  if (loading) {
	    return (
	      <div className="min-h-screen flex items-center justify-center bg-gray-50">
	        <div className="flex items-center gap-3 text-gray-500 bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100">
	          <Loader2 className="animate-spin w-5 h-5 text-blue-600" />
	          <span className="font-medium">Loading dashboard...</span>
	        </div>
	      </div>
	    );
	  }

  const trend = stats?.trendPercentage || 0;
  const isPositiveTrend = trend >= 0;
	const formatMoney = (value: number) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

	const aging = stats?.invoiceAging;
	const topClients = stats?.topClients || [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const getClientName = (clientId: Invoice['clientId']) => (clientId as { name?: string }).name;

  return (
    <div className="p-6 bg-gray-50 min-h-screen max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                {today}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block mr-2">
                 <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">MoM Growth</p>
                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isPositiveTrend ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isPositiveTrend ? <TrendingUp className="w-3 h-3 mr-1.5"/> : <TrendingDown className="w-3 h-3 mr-1.5"/>}
                    {trend.toFixed(1)}%
                 </span>
            </div>
            <button 
                onClick={() => navigate('/invoices/new')}
                className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-200"
            >
                <Plus className="w-4 h-4" />
                <span>New Invoice</span>
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
            title="Total Revenue" 
            value={formatMoney(stats?.totalRevenue || 0)} 
            icon={DollarSign} 
            iconColor="text-emerald-600"
            bgColor="bg-emerald-500/10"
            trend="+12.5%"
            trendUp={true}
        />
        <StatCard 
            title="Net Profit" 
            value={formatMoney(stats?.netProfit || 0)} 
            icon={Activity} 
            iconColor="text-indigo-600"
            bgColor="bg-indigo-500/10"
            trend="+8.2%"
            trendUp={true}
        />
        <StatCard 
            title="Total Expenses" 
            value={formatMoney(stats?.totalExpenses || 0)} 
            icon={TrendingDown} 
            iconColor="text-rose-600"
            bgColor="bg-rose-500/10"
            trend="-2.4%"
            trendUp={false} 
        />
        <StatCard 
            title="Outstanding" 
            value={formatMoney(stats?.pendingAmount || 0)} 
            icon={FileText} 
            iconColor="text-amber-600"
            bgColor="bg-amber-500/10"
            trend="+4.1%"
            trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Cash Flow</h2>
                    <p className="text-sm text-gray-500">Income vs Expenses over time</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Income
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expense
                    </div>
                </div>
            </div>
            <div className="h-80 w-full"> 
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#9ca3af', fontSize: 12}}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#9ca3af', fontSize: 12}}
                            tickFormatter={(value) => `$${value/1000}k`}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                            }}
                            cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="income" 
                            name="Income" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorIncome)" 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="expense" 
                            name="Expense" 
                            stroke="#f43f5e" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorExpense)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Invoice Aging */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Invoice Aging</h2>
                <p className="text-sm text-gray-500">Unpaid invoices by due date</p>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-3">
                <AgingRow label="Current" bucket={aging?.current} color="bg-emerald-500" />
                <AgingRow label="1–30 Days Overdue" bucket={aging?.overdue1_30} color="bg-amber-500" />
                <AgingRow label="31–60 Days Overdue" bucket={aging?.overdue31_60} color="bg-orange-500" />
                <AgingRow label="61–90 Days Overdue" bucket={aging?.overdue61_90} color="bg-rose-500" />
                <AgingRow label="90+ Days Overdue" bucket={aging?.overdue90_plus} color="bg-red-600" />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                     <div>
                        <p className="text-xs text-gray-500">Total Outstanding</p>
                        <p className="text-xl font-bold text-gray-900">{formatMoney(stats?.pendingAmount || 0)}</p>
                     </div>
                     <button onClick={() => navigate('/invoices')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        View Details
                     </button>
                </div>
            </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Recent Invoices</h2>
                <button onClick={() => navigate('/invoices')} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <th className="pb-3 pl-4">Invoice</th>
                            <th className="pb-3">Client</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3 text-right">Amount</th>
                            <th className="pb-3 text-right pr-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {(stats?.recentInvoices || []).slice(0, 5).map((inv: Invoice) => (
                            <tr key={inv._id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 pl-4 font-medium text-gray-900">#{inv.number}</td>
                                <td className="py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                                            {getInitials(getClientName(inv.clientId))}
                                        </div>
                                        <span className="text-sm text-gray-700 truncate max-w-[140px]" title={getClientName(inv.clientId)}>
                                            {getClientName(inv.clientId) || 'Unknown'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 text-sm text-gray-500">
                                    {new Date(inv.date).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-right font-medium text-gray-900">
                                    ${inv.total.toFixed(2)}
                                </td>
                                <td className="py-4 text-right pr-4">
                                    <StatusBadge status={inv.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No recent invoices found.</p>
                        <button onClick={() => navigate('/invoices/new')} className="text-blue-600 font-medium text-sm">Create Invoice</button>
                    </div>
                )}
            </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Top Clients</h2>
                <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
                {topClients.slice(0, 5).map((c, i) => (
                    <div 
                        key={c.clientId} 
                        onClick={() => navigate(`/clients/${c.clientId}`)}
                        className="flex items-center justify-between group p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer gap-4"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                i === 0 ? 'bg-amber-100 text-amber-700' : 
                                i === 1 ? 'bg-slate-100 text-slate-700' : 
                                i === 2 ? 'bg-orange-100 text-orange-800' : 
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {getInitials(c.name)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate" title={c.name}>{c.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">{c.invoiceCount} invoices</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="font-bold text-sm text-gray-900">{formatMoney(c.revenue)}</p>
                            {c.outstanding > 0 ? (
                                <p className="text-xs text-rose-500 font-medium mt-0.5">Due: {formatMoney(c.outstanding)}</p>
                            ) : (
                                <div className="h-4"></div> /* Spacer to maintain height consistency if needed, or just leave empty */
                            )}
                        </div>
                    </div>
                ))}
                
                {topClients.length === 0 && (
                     <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">No client data available yet.</p>
                    </div>
                )}
            </div>
            <button 
                onClick={() => navigate('/clients')}
                className="w-full mt-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
            >
                View All Clients
            </button>
        </div>

      </div>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ title, value, icon: Icon, iconColor, bgColor, trend, trendUp }: { 
    title: string; value: string; icon: LucideIcon; iconColor: string; bgColor: string; trend?: string; trendUp?: boolean 
}) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${bgColor} ${iconColor}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
                        trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                        {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}

function AgingRow({ label, bucket, color }: { label: string; bucket?: { amount: number; count: number }; color: string }) {
    const amount = bucket?.amount || 0;
    const count = bucket?.count || 0;
    const max = 5000;
    const percent = Math.min((amount / max) * 100, 100);

    return (
        <div className="group">
            <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">${amount.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-2">({count})</span>
                </div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} rounded-full transition-all duration-500`} 
                    style={{ width: `${Math.max(percent, count > 0 ? 5 : 0)}%` }}
                />
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        paid: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        overdue: 'bg-rose-100 text-rose-700',
        draft: 'bg-gray-100 text-gray-700',
    };
    
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${styles[status] || styles.draft}`}>
            {status}
        </span>
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
