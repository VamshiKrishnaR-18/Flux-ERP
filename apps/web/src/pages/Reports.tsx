import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, PieChart as PieChartIcon, TrendingUp, Download, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

type RevenuePoint = { month: string; revenue: number; profit: number };
type ExpensePoint = { _id: string; total: number };

export default function Reports() {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
    const [expenseData, setExpenseData] = useState<ExpensePoint[]>([]);
    const [taxData, setTaxData] = useState<{totalTax: number, totalTaxable: number, totalRevenue: number} | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
        const fetchData = async () => {
            try {
                const [revRes, expRes, taxRes] = await Promise.all([
                    api.get('/reports/revenue-vs-expenses'),
                    api.get('/reports/expense-breakdown'),
                    api.get('/reports/tax')
                ]);
                setRevenueData(revRes.data.data);
                setExpenseData(expRes.data.data);
                setTaxData(taxRes.data.data);
            } catch (error) {
                console.error("Failed to load reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !isMounted) {
        return (
            <div className="flex h-[50vh] items-center justify-center bg-gray-50/30 dark:bg-slate-950 transition-colors">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/30 dark:bg-slate-950 min-h-screen transition-colors duration-200">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <PieChartIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" /> Reports & Analytics
                </h1>
                
                <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-slate-900 text-gray-400 dark:text-slate-600 border border-transparent dark:border-slate-800 rounded-xl cursor-not-allowed font-medium transition-all">
                    <Download className="w-4 h-4" /> Export PDF
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 group">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl transition-transform group-hover:scale-110">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.15em] mb-1">Net Profit (YTD)</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                                ${revenueData.reduce((acc, curr) => acc + (curr.profit || 0), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 group">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl transition-transform group-hover:scale-110">
                            <DollarSign className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.15em] mb-1">Tax Collected</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                                ${taxData?.totalTax.toLocaleString() ?? '0.00'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 group">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl transition-transform group-hover:scale-110">
                            <DollarSign className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[0.15em] mb-1">Total Expenses</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                                ${expenseData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-8 tracking-tight">Monthly Revenue vs Profit</h3>
                    <div className="h-80 w-full min-h-[320px] relative">
                        {isMounted && revenueData && revenueData.length > 0 ? (
                            <ErrorBoundary>
                                <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f3f4f6'} />
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: theme === 'dark' ? '#64748b' : '#9ca3af', fontSize: 12, fontWeight: 500}}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: theme === 'dark' ? '#64748b' : '#9ca3af', fontSize: 12, fontWeight: 500}}
                                            tickFormatter={(value) => `$${value}`} 
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
                                            cursor={{ fill: theme === 'dark' ? '#334155' : '#f8fafc', opacity: 0.4 }}
                                            formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, ""]} 
                                        />
                                        <Legend 
                                            verticalAlign="top" 
                                            align="right" 
                                            iconType="circle"
                                            wrapperStyle={{ paddingBottom: '20px' }}
                                        />
                                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                                        <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ErrorBoundary>
                        ) : null}
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-8 tracking-tight">Expense Breakdown</h3>
                    <div className="h-80 flex items-center justify-center w-full min-h-[320px] relative">
                        {expenseData && expenseData.length > 0 && isMounted ? (
                            <ErrorBoundary>
                                <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                                    <PieChart>
                                        <Pie
                                            data={expenseData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={8}
                                            dataKey="total"
                                            nameKey="_id"
                                            stroke="none"
                                        >
                                            {expenseData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
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
                                            formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, ""]} 
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            align="center" 
                                            iconType="circle"
                                            layout="horizontal"
                                            wrapperStyle={{ paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ErrorBoundary>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
