import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { 
	  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
	} from 'recharts';
import { DollarSign, FileText, TrendingUp, TrendingDown, ArrowRight, Activity, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type MoneyBucket = { amount: number; count: number };

type DashboardStats = {
	totalRevenue: number;
	totalExpenses: number;
	netProfit: number;
	totalInvoices: number;
	pendingAmount: number;
	totalClients: number;
	recentInvoices: any[];
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
	const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

	const aging = stats?.invoiceAging;
	const topClients = stats?.topClients || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Overview of your business performance</p>
        </div>
        <div className="text-right">
             <p className="text-sm text-gray-500 mb-1">MoM Growth</p>
             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPositiveTrend ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isPositiveTrend ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                {trend.toFixed(1)}%
             </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* ✅ FIXED KEYS BELOW */}
        <StatCard 
            title="Total Revenue" 
				value={formatMoney(stats?.totalRevenue || 0)} 
            icon={DollarSign} 
            color="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
            title="Net Profit" 
				value={formatMoney(stats?.netProfit || 0)} 
            icon={Activity} 
            color="bg-indigo-100 text-indigo-600" 
        />
        <StatCard 
            title="Total Expenses" 
				value={formatMoney(stats?.totalExpenses || 0)} 
            icon={TrendingDown} 
            color="bg-red-100 text-red-600" 
        />
        <StatCard 
				title="Outstanding Invoices" 
				value={formatMoney(stats?.pendingAmount || 0)} 
            icon={FileText} 
            color="bg-amber-100 text-amber-600" 
        />
      </div>

		  {/* Insights */}
		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
			<div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-bold text-gray-800">Invoice aging</h2>
					<span className="text-xs font-medium text-gray-500">Based on due date</span>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<AgingCard label="Current" bucket={aging?.current} tone="emerald" />
					<AgingCard label="Overdue 1–30" bucket={aging?.overdue1_30} tone="amber" />
					<AgingCard label="Overdue 31–60" bucket={aging?.overdue31_60} tone="orange" />
					<AgingCard label="Overdue 61–90" bucket={aging?.overdue61_90} tone="red" />
					<AgingCard label="Overdue 90+" bucket={aging?.overdue90_plus} tone="red" />
					<div className="rounded-lg border border-dashed border-gray-200 p-4 bg-gray-50/60">
						<p className="text-xs font-medium text-gray-500">Active Clients</p>
						<div className="mt-2 flex items-end justify-between gap-4">
							<p className="text-2xl font-bold text-gray-900">{stats?.totalClients ?? 0}</p>
							<button
								onClick={() => navigate('/clients')}
								className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
							>
								View clients <ArrowRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-bold text-gray-800">Top clients</h2>
					<Users className="w-5 h-5 text-gray-400" />
				</div>
				<div className="space-y-3">
					{topClients.map((c) => (
						<div key={c.clientId} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition">
							<div>
								<p className="font-medium text-gray-900 truncate max-w-[180px]">{c.name || 'Unknown client'}</p>
								<p className="text-xs text-gray-500">{c.invoiceCount} invoice{c.invoiceCount === 1 ? '' : 's'}</p>
							</div>
							<div className="text-right">
								<p className="font-bold text-sm">{formatMoney(c.revenue)}</p>
								<p className="text-[11px] text-gray-500">Outstanding: {formatMoney(c.outstanding)}</p>
							</div>
						</div>
					))}
					{topClients.length === 0 && (
						<div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/60">
							<p className="text-gray-500">No client revenue yet.</p>
							<button
								onClick={() => navigate('/invoices/new')}
								className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
							>
								Create an invoice <ArrowRight className="w-4 h-4" />
							</button>
						</div>
					)}
				</div>
			</div>
		  </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Cash Flow (Income vs Expense)</h2>
            <div className="h-80 w-full"> 
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f3f4f6' }}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Invoices</h2>
	            <div className="space-y-4">
	                {(stats?.recentInvoices || []).map((inv: any) => (
	                    <div key={inv._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition border border-gray-100">
	                        <div>
	                            <p className="font-medium text-gray-900">#{inv.number}</p>
	                            <p className="text-xs text-gray-500">{inv.clientId?.name || 'Unknown'}</p>
	                        </div>
	                        <div className="text-right">
	                            <p className="font-bold text-sm">${inv.total.toFixed(2)}</p>
	                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
	                                inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
	                            }`}>
	                                {inv.status}
	                            </span>
	                        </div>
	                    </div>
	                ))}
	                
	                {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
	                  <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/60">
	                    <p className="text-gray-500 mb-2">No recent invoices yet.</p>
	                    <button
	                      onClick={() => navigate('/invoices/new')}
	                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
	                    >
	                      Create your first invoice <ArrowRight className="w-4 h-4" />
	                    </button>
	                  </div>
	                )}
	            </div>
            <button 
                onClick={() => navigate('/invoices')}
                className="w-full mt-6 text-sm text-gray-600 hover:text-black font-medium flex items-center justify-center gap-1"
            >
                View All Invoices <ArrowRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function AgingCard({ label, bucket, tone }: { label: string; bucket?: { amount: number; count: number }; tone: 'emerald' | 'amber' | 'orange' | 'red' }) {
	const amount = bucket?.amount || 0;
	const count = bucket?.count || 0;
	const toneClasses: Record<string, string> = {
		emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
		amber: 'bg-amber-50 border-amber-100 text-amber-700',
		orange: 'bg-orange-50 border-orange-100 text-orange-700',
		red: 'bg-red-50 border-red-100 text-red-700'
	};

	return (
		<div className={`rounded-lg border p-4 ${toneClasses[tone] || toneClasses.emerald}`}>
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-medium opacity-80">{label}</p>
					<p className="mt-1 text-xl font-bold text-gray-900">${amount.toFixed(2)}</p>
				</div>
				<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 border border-white/60 text-gray-700">
					{count} invoice{count === 1 ? '' : 's'}
				</span>
			</div>
		</div>
	);
}