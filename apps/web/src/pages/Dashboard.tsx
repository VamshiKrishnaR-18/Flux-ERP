import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { DollarSign, Users, FileText, TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data.data))
      .catch(err => console.error("Dashboard Load Error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

  const trend = stats?.trendPercentage || 0;
  const isPositiveTrend = trend >= 0;

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
            value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} 
            icon={DollarSign} 
            color="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
            title="Net Profit" 
            value={`$${(stats?.netProfit || 0).toFixed(2)}`} 
            icon={Activity} 
            color="bg-indigo-100 text-indigo-600" 
        />
        <StatCard 
            title="Total Expenses" 
            value={`$${(stats?.totalExpenses || 0).toFixed(2)}`} 
            icon={TrendingDown} 
            color="bg-red-100 text-red-600" 
        />
        <StatCard 
            title="Pending Invoices" 
            value={`$${(stats?.pendingAmount || 0).toFixed(2)}`} 
            icon={FileText} 
            color="bg-amber-100 text-amber-600" 
        />
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
                    <p className="text-gray-400 text-center py-4">No recent activity.</p>
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