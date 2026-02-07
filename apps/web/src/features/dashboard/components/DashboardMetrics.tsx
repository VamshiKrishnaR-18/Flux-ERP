import { ArrowUpRight, TrendingUp, FileText, Clock, Users } from 'lucide-react';
import type { DashboardStats } from '../hooks/useDashboard';

export const DashboardMetrics = ({ stats }: { stats: DashboardStats | null }) => {
  
  
  const trend = stats?.trendPercentage || 0;
  const isPositive = trend >= 0;
  const trendLabel = `${Math.abs(trend).toFixed(1)}% from last month`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      
      {/* 1. Total Revenue */}
      <MetricCard 
        label="Total Revenue" 
        value={`$${stats?.totalRevenue.toLocaleString() || '0.00'}`}
        trend={trendLabel} 
        trendUp={isPositive} 
        icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} 
        color="bg-emerald-50"
      />

      {/* 2. Total Invoices */}
      <MetricCard 
        label="Total Invoices" 
        value={stats?.totalInvoices || 0}
        trend="Lifetime" 
        trendUp={true} 
        icon={<FileText className="w-6 h-6 text-blue-600" />} 
        color="bg-blue-50"
      />

      {/* 3. Pending Amount */}
      <MetricCard 
        label="Pending Amount" 
        value={`$${stats?.pendingAmount?.toLocaleString() || '0.00'}`}
        trend="Unpaid invoices" 
        trendUp={false} 
        icon={<Clock className="w-6 h-6 text-amber-600" />} 
        color="bg-amber-50"
      />

      {/* 4. Active Clients */}
      <MetricCard 
        label="Active Clients" 
        value={stats?.totalClients || 0}
        trend="Total active" 
        trendUp={true} 
        icon={<Users className="w-6 h-6 text-violet-600" />} 
        color="bg-violet-50"
      />
    </div>
  );
};


interface MetricCardProps {
  label: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ label, value, trend, trendUp, icon, color }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-50'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : null} {trend}
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h4>
        <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}