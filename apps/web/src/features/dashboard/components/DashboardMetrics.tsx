import { ArrowUpRight, ArrowDownRight, TrendingUp, FileText, Clock, Users } from 'lucide-react';
import type { DashboardStats } from '../useDashboard';

export const DashboardMetrics = ({ stats }: { stats: DashboardStats | null }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <MetricCard 
        label="Total Revenue" value={`$${stats?.totalRevenue.toLocaleString() || '0.00'}`}
        trend="+12.5%" trendUp={true} icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} color="bg-emerald-50"
      />
      <MetricCard 
        label="Total Invoices" value={stats?.totalInvoices || 0}
        trend="+4 this week" trendUp={true} icon={<FileText className="w-6 h-6 text-blue-600" />} color="bg-blue-50"
      />
      <MetricCard 
        label="Pending Amount" value={stats?.pendingInvoices || 0}
        trend="Needs attention" trendUp={false} icon={<Clock className="w-6 h-6 text-amber-600" />} color="bg-amber-50"
      />
      <MetricCard 
        label="Active Clients" value={stats?.totalClients || 0}
        trend="+2 new" trendUp={true} icon={<Users className="w-6 h-6 text-violet-600" />} color="bg-violet-50"
      />
    </div>
  );
};

// Sub-component (Internal use only)
function MetricCard({ label, value, trend, trendUp, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {trend}
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h4>
        <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}