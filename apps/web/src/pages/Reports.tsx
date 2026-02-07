import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, PieChart as PieChartIcon, TrendingUp, Download, Loader2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

type RevenuePoint = { month: string; revenue: number; profit: number };
type ExpensePoint = { _id: string; total: number };

export default function Reports() {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
    const [expenseData, setExpenseData] = useState<ExpensePoint[]>([]);
    const [taxData, setTaxData] = useState<{totalTax: number, totalTaxable: number, totalRevenue: number} | null>(null);

    useEffect(() => {
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

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <PieChartIcon className="w-6 h-6" /> Reports & Analytics
                </h1>
                
                <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                    <Download className="w-4 h-4" /> Export PDF
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Net Profit (YTD)</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${revenueData.reduce((acc, curr) => acc + (curr.profit || 0), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Tax Collected</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${taxData?.totalTax.toLocaleString() ?? '0.00'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${expenseData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Revenue vs Profit</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, ""]} />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Expense Breakdown</h3>
                    <div className="h-80 flex items-center justify-center">
                        {expenseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="total"
                                        nameKey="_id"
                                    >
                                        {expenseData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, ""]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-400">No expense data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
