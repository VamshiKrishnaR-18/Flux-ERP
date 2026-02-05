import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { Search, ArrowUpDown, Plus, DollarSign, Calendar, Tag, Trash2, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import { useSortableData } from '../hooks/useSortableData';
import { useDebounce } from '../hooks/useDebounce'; // ✅ Import Debounce
import axios from 'axios';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Operational' });

  // ✅ Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500); // Wait 500ms
  const LIMIT = 10;

  // Sorting (Client-side for current page)
  const { items: sortedExpenses, requestSort, sortConfig } = useSortableData(expenses);
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortConfig.direction === 'ascending' ? 'text-blue-600 rotate-180' : 'text-blue-600'}`} />;
  };

  // ✅ Fetch Data (Triggered by Page or Search)
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
        // Pass search param to backend
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
      setPage(1); // Reset to page 1
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...formData, amount: Number(formData.amount) });
      fetchExpenses(); // Reload
      setShowModal(false);
      setFormData({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Operational' });
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="w-6 h-6" /> Expenses</h1>
        <div className="flex items-center gap-3">
             <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search expenses..." 
                    value={search} 
                    onChange={handleSearchChange} // 👈 Updated handler
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none" 
                />
             </div>
	            <button
	              onClick={handleExportCsv}
	              disabled={isExporting}
	              className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
	            >
	              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
	              Export CSV
	            </button>
            <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2"><Plus className="w-4 h-4" /> Add Expense</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin w-5 h-5" /> Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No expenses found.</div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold cursor-pointer select-none">
                <tr>
                  <th className="px-6 py-4 hover:bg-gray-100" onClick={() => requestSort('description')}>Description <SortIcon column="description" /></th>
                  <th className="px-6 py-4 hover:bg-gray-100" onClick={() => requestSort('category')}>Category <SortIcon column="category" /></th>
                  <th className="px-6 py-4 hover:bg-gray-100" onClick={() => requestSort('date')}>Date <SortIcon column="date" /></th>
                  <th className="px-6 py-4 text-right hover:bg-gray-100" onClick={() => requestSort('amount')}>Amount <SortIcon column="amount" /></th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedExpenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200"><Tag className="w-3 h-3" /> {expense.category}</span></td>
                    <td className="px-6 py-4 text-gray-500 text-sm"><div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-gray-400" />{new Date(expense.date).toLocaleDateString()}</div></td>
                    <td className="px-6 py-4 text-right font-medium text-red-600">-${expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => handleDelete(expense._id)} className="text-gray-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-500">Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span></div>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded hover:bg-white disabled:opacity-50 flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal (Unchanged) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div><label className="block text-sm font-medium mb-1">Description</label><input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-2 rounded-lg" /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium mb-1">Amount ($)</label><input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border p-2 rounded-lg" /></div>
                 <div><label className="block text-sm font-medium mb-1">Date</label><input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border p-2 rounded-lg" /></div>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-2 rounded-lg bg-white">
                     {['Operational', 'Marketing', 'Salary', 'Software', 'Office', 'Travel'].map(c => <option key={c}>{c}</option>)}
                  </select>
               </div>
               <div className="flex justify-end gap-2 mt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                 <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Save</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}