import { useDashboard } from '../features/dashboard/useDashboard';
import { DashboardMetrics } from '../features/dashboard/components/DashboardMetrics';
import { DashboardCharts } from '../features/dashboard/components/DashboardCharts';
import { RecentInvoices } from '../features/dashboard/components/RecentInvoices';
import { Calendar, Filter, Download } from 'lucide-react';

export default function Dashboard() {
  // 1. Logic is abstracted away
  const { stats, isLoading, revenueData, statusData } = useDashboard();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10 font-sans text-slate-800">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
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

      {/* 2. Loading State */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center text-slate-400">Loading Dashboard...</div>
      ) : (
        <>
          {/* 3. Composed Components */}
          <DashboardMetrics stats={stats} />
          
          <DashboardCharts 
            revenueData={revenueData} 
            statusData={statusData} 
            totalInvoices={stats?.totalInvoices || 0} 
          />
          
          <div className="grid grid-cols-1 gap-6">
            <RecentInvoices invoices={stats?.recentInvoices || []} />
          </div>
        </>
      )}
    </div>
  );
}