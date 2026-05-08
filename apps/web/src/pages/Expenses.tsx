import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { Search, ArrowUpDown, Plus, DollarSign, Calendar, Tag, Trash2, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { useSortableData } from '../hooks/useSortableData';
import { useDebounce } from '../hooks/useDebounce'; 
import { AttachmentList } from '../components/AttachmentList';
import axios from 'axios';
import { EmptyState } from '../components/EmptyState'; 

interface Expense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  attachments?: any[];
}

const expenseListStyles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, color: '#111', fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottom: '1px solid #F3F4F6' },
  colDescription: { width: '36%' },
  colCategory: { width: '22%' },
  colDate: { width: '20%' },
  colAmount: { width: '22%', textAlign: 'right' }
});

const ExpenseListPDF = ({ expenses }: { expenses: Expense[] }) => (
  <Document>
    <Page size="A4" style={expenseListStyles.page}>
      <Text style={expenseListStyles.title}>Expenses</Text>
      <View style={expenseListStyles.tableHeader}>
        <Text style={expenseListStyles.colDescription}>Description</Text>
        <Text style={expenseListStyles.colCategory}>Category</Text>
        <Text style={expenseListStyles.colDate}>Date</Text>
        <Text style={expenseListStyles.colAmount}>Amount</Text>
      </View>
      {expenses.map((expense) => (
        <View key={expense._id} style={expenseListStyles.row}>
          <Text style={expenseListStyles.colDescription}>{expense.description}</Text>
          <Text style={expenseListStyles.colCategory}>{expense.category}</Text>
          <Text style={expenseListStyles.colDate}>{new Date(expense.date).toLocaleDateString()}</Text>
          <Text style={expenseListStyles.colAmount}>-{expense.amount.toFixed(2)}</Text>
        </View>
      ))}
    </Page>
  </Document>
);

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{ description: string; amount: string; date: string; category: string; attachments: any[] }>({ 
    description: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    category: 'Operational',
    attachments: [] 
  });

  //  Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500); // Wait 500ms
  const LIMIT = 10;

  // Sorting 
  const { items: sortedExpenses, requestSort, sortConfig } = useSortableData(expenses);
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortConfig.direction === 'ascending' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  // Fetch Data 
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
        
        const res = await api.get(`/expenses?page=${page}&limit=${LIMIT}&search=${debouncedSearch}`);
        setExpenses(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) { 
        console.error(err);
        toast.error("Failed to load expenses");
    } finally { 
        setIsLoading(false); 
    }
  }, [page, LIMIT, debouncedSearch]);
  
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]); // 👈 Re-run on change

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...formData, amount: Number(formData.amount) });
      fetchExpenses(); // Reload
      setShowModal(false);
      setFormData({ 
        description: '', 
        amount: '', 
        date: new Date().toISOString().split('T')[0], 
        category: 'Operational',
        attachments: [] 
      });
      toast.success('Expense recorded');
    } catch { toast.error('Failed to add expense'); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this expense?")) return;
    try { await api.delete(`/expenses/${id}`); setExpenses(prev => prev.filter(e => e._id !== id)); toast.success("Expense deleted"); } 
    catch { toast.error("Failed to delete"); }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await api.get(`/expenses/export/csv${qs}`, { responseType: 'blob' });

      const disposition = (res.headers?.['content-disposition'] as string | undefined) ?? '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const fallback = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      const filename = match?.[1] ?? fallback;

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('CSV exported');
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message 
        : 'Failed to export CSV';
      toast.error(message || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const qs = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await api.get(`/expenses?page=1&limit=10000${qs}`);
      const allExpenses = res.data.data as Expense[];
      const blob = await pdf(<ExpenseListPDF expenses={allExpenses} />).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported');
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) 
        ? error.response?.data?.message 
        : 'Failed to export PDF';
      toast.error(message || 'Failed to export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-red-600 dark:text-red-400" /> Expenses
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Track and manage your business expenditures</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search expenses..." 
                    value={search} 
                    onChange={handleSearchChange} 
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl outline-none text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm" 
                />
             </div>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-60 shadow-sm"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export PDF
            </button>
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-60 shadow-sm"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </button>
            <button onClick={() => setShowModal(true)} className="bg-red-600 dark:bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"><Plus className="w-5 h-5" /> Add Expense</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
        {isLoading ? (
          <div className="p-20 text-center text-gray-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin w-6 h-6 text-red-600 dark:text-red-400" /> Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState 
            title="No expenses found"
            description="Track your business expenses here."
            icon={DollarSign}
            actionLabel="Add Expense"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-xs uppercase text-gray-500 dark:text-slate-400 font-semibold cursor-pointer select-none">
                  <tr>
                    <th className="px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('description')}>Description <SortIcon column="description" /></th>
                    <th className="px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('category')}>Category <SortIcon column="category" /></th>
                    <th className="px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('date')}>Date <SortIcon column="date" /></th>
                    <th className="px-6 py-4 text-right hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('amount')}>Amount <SortIcon column="amount" /></th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {sortedExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all group">
                      <td className="px-6 py-5 font-bold text-gray-900 dark:text-slate-100">{expense.description}</td>
                      <td className="px-6 py-5"><span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-bold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 uppercase tracking-wider"><Tag className="w-3 h-3" /> {expense.category}</span></td>
                      <td className="px-6 py-5 text-gray-500 dark:text-slate-400 text-sm"><div className="flex items-center gap-2 font-medium"><Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />{new Date(expense.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div></td>
                      <td className="px-6 py-5 text-right font-black text-red-600 dark:text-red-400 text-base">-${expense.amount.toFixed(2)}</td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleDelete(expense._id)} 
                          className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-slate-400">Page <span className="font-bold text-gray-900 dark:text-slate-100">{page}</span> of <span className="font-bold text-gray-900 dark:text-slate-100">{totalPages}</span></div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm text-gray-600 dark:text-slate-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} 
                  className="p-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm text-gray-600 dark:text-slate-400"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal  */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-slate-100 tracking-tight">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
               <div><label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Description</label><input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 transition-all" placeholder="Office Supplies..." /></div>
               <div className="grid grid-cols-2 gap-5">
                 <div><label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Amount ($)</label><input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 transition-all" placeholder="0.00" /></div>
                 <div><label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Date</label><input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 transition-all" /></div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 transition-all">
                     {['Operational', 'Marketing', 'Salary', 'Software', 'Office', 'Travel'].map(c => <option key={c}>{c}</option>)}
                  </select>
               </div>

               <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                 <AttachmentList 
                    attachments={formData.attachments} 
                    onUpdate={async (attachments) => setFormData({ ...formData, attachments })} 
                 />
               </div>

               <div className="flex justify-end gap-3 mt-8">
                 <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all">Cancel</button>
                 <button type="submit" className="px-8 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-600 shadow-md transition-all active:scale-95">Save Expense</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
