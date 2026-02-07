import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { MoreHorizontal } from 'lucide-react';

interface DashboardChartsProps {
  revenueData: { name: string; income: number; expense: number }[];
  statusData: { name: string; value: number; color: string }[];
  totalInvoices: number;
}

export const DashboardCharts = ({ revenueData, statusData, totalInvoices }: DashboardChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
      
      {/* --- INVOICE STATUS (DONUT CHART) --- */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-w-0">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800">Invoice Status</h3>
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* WRAPPER DIV */}
        <div className="relative w-full h-[300px]" style={{ minHeight: '300px' }}>
          {/* ✅ FIX: Added minWidth={0} to prevent negative width errors */}
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie 
                data={statusData} 
                cx="50%" 
                cy="50%" 
                innerRadius={70} 
                outerRadius={90} 
                paddingAngle={5} 
                dataKey="value" 
                stroke="none"
              >
                {statusData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-extrabold text-slate-900">{totalInvoices}</span>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide mt-1">Total</span>
          </div>
        </div>
      </div>

      {/* --- FINANCIAL OVERVIEW (AREA CHART) --- */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Financial Overview</h3>
            <p className="text-sm text-slate-500">Income vs Expenses over last 6 months</p>
          </div>
        </div>

        {/* WRAPPER DIV */}
        <div className="w-full h-[300px]" style={{ minHeight: '300px' }}>
          {/* ✅ FIX: Added minWidth={0} */}
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94A3B8', fontSize: 12 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94A3B8', fontSize: 12 }} 
                tickFormatter={(value) => `$${value}`} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#8B5CF6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};