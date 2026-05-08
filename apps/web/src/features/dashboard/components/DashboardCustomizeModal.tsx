import { useState } from 'react';
import { X, Check, Layout, BarChart3, Clock, FileText, Users } from 'lucide-react';

interface Widget {
  id: string;
  name: string;
  description: string;
  icon: any;
}

const AVAILABLE_WIDGETS: Widget[] = [
  { id: 'stats', name: 'Key Metrics', description: 'Revenue, Profit, Expenses, and Outstanding', icon: BarChart3 },
  { id: 'cashflow', name: 'Cash Flow Chart', description: 'Monthly Income vs Expenses visualization', icon: Layout },
  { id: 'aging', name: 'Invoice Aging', description: 'Breakdown of unpaid invoices by due date', icon: Clock },
  { id: 'recentInvoices', name: 'Recent Invoices', description: 'Quick view of latest billing activities', icon: FileText },
  { id: 'topClients', name: 'Top Clients', description: 'Performance overview of your best clients', icon: Users },
];

interface DashboardCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: string[];
  onSave: (config: string[]) => void;
}

export function DashboardCustomizeModal({ isOpen, onClose, currentConfig, onSave }: DashboardCustomizeModalProps) {
  const [selected, setSelected] = useState<string[]>(currentConfig);

  if (!isOpen) return null;

  const toggleWidget = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Customize Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Select the widgets you want to see</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {AVAILABLE_WIDGETS.map((widget) => {
            const isSelected = selected.includes(widget.id);
            const Icon = widget.icon;
            
            return (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${
                  isSelected 
                    ? 'border-black dark:border-slate-100 bg-gray-50 dark:bg-slate-800/50' 
                    : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-black dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-slate-100">{widget.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{widget.description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'bg-black dark:bg-slate-100 border-black dark:border-slate-100 text-white dark:text-slate-900' 
                    : 'border-gray-200 dark:border-slate-700 group-hover:border-gray-300 dark:group-hover:border-slate-600'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 flex gap-3 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-black dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-gray-800 dark:hover:bg-slate-200 transition-all shadow-lg shadow-black/10 dark:shadow-white/5"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
