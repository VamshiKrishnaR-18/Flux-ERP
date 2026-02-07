import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';

interface PaymentModalProps {
  invoiceId: string;
  totalDue: number; // To show how much is left
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ invoiceId, totalDue, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
    method: 'Bank Transfer',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post(`/invoices/${invoiceId}/payment`, {
        amount: Number(formData.amount),
        date: formData.date,
        method: formData.method,
        notes: formData.notes
      });
      
      toast.success("Payment recorded!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Record Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input 
              type="number" 
              required
              min="0.01"
              step="0.01"
              max={totalDue}
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={`Max: $${totalDue.toFixed(2)}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select 
                value={formData.method}
                onChange={e => setFormData({...formData, method: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Check</option>
                <option>Credit Card (Offline)</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea 
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="e.g. Received via wire transfer..."
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
