import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingDown } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'office',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch Expenses
  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data.data);
    } catch (error) {
      toast.error("Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  // Handle Create
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount)
      });
      toast.success("Expense recorded!");
      setIsModalOpen(false);
      setFormData({ description: '', amount: '', category: 'office', date: new Date().toISOString().split('T')[0] });
      fetchExpenses(); // Refresh list
    } catch (error) {
      toast.error("Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if(!confirm("Delete this expense?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e._id !== id));
      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <main className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-500">Track company spending</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs uppercase font-bold">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">-${expense.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(expense._id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <TrendingDown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    No expenses recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">New Expense</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input 
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border p-2 rounded" 
                  placeholder="e.g. Office Rent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input 
                    type="number" step="0.01" required
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full border p-2 rounded" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input 
                    type="date" required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full border p-2 rounded" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full border p-2 rounded"
                >
                  <option value="office">Office</option>
                  <option value="software">Software</option>
                  <option value="marketing">Marketing</option>
                  <option value="travel">Travel</option>
                  <option value="salary">Salary</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}