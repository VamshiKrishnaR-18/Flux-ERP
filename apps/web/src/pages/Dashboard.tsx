import { useDashboard } from '../features/dashboard/useDashboard';
import { DashboardCharts } from '../features/dashboard/components/DashboardCharts';
import { RecentInvoices } from '../features/dashboard/components/RecentInvoices';
import { 
  Calendar, 
  Filter, 
  Download,
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Clock 
} from 'lucide-react';

// ✅ Internal Component for the Cards
const MetricCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function Dashboard() {
  const { stats, isLoading, revenueData, statusData } = useDashboard();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10 font-sans text-slate-800">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Good Morning, {user.name?.split(' ')[0] || 'Admin'}! 👋</h1>
          <p className="text-slate-500 mt-2 font-medium">{today}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
           <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"><Calendar className="w-4 h-4" /> This Month</button>
           <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"><Filter className="w-4 h-4" /> Filter</button>
           <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"><Download className="w-4 h-4" /> Export</button>
        </div>
      </header>

      {isLoading ? (
        <div className="h-96 flex items-center justify-center text-slate-400">Loading Dashboard...</div>
      ) : (
        <>
          {/* ✅ NEW: 4-Column Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              {/* 1. Revenue */}
              <MetricCard
                  title="Total Revenue"
                  value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
                  icon={DollarSign}
                  color="bg-blue-50 text-blue-600"
              />

              {/* 2. Expenses */}
              <MetricCard
                  title="Total Expenses"
                  value={`$${stats?.totalExpenses?.toLocaleString() || '0'}`}
                  icon={TrendingDown}
                  color="bg-red-50 text-red-600"
              />

              {/* 3. Net Profit */}
              <MetricCard
                  title="Net Profit"
                  value={`$${stats?.netProfit?.toLocaleString() || '0'}`}
                  icon={TrendingUp}
                  color="bg-emerald-50 text-emerald-600"
              />

              {/* 4. Pending */}
              <MetricCard
                  title="Pending Amount"
                  value={`$${stats?.pendingAmount?.toLocaleString() || '0'}`}
                  icon={Clock}
                  color="bg-yellow-50 text-yellow-600"
              />
          </div>
          
          <DashboardCharts 
            revenueData={revenueData} 
            statusData={statusData} 
            totalInvoices={stats?.totalInvoices || 0} 
          />
          
          <div className="grid grid-cols-1 gap-6 mt-8">
            <RecentInvoices invoices={stats?.recentInvoices || []} />
          </div>
        </>
      )}
    </div>
  );
}