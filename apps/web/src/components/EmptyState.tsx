import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  stepNumber?: number;
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon, 
  actionLabel, 
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  stepNumber
}: EmptyStateProps) {
  return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-gray-300 dark:text-slate-600" />
        </div>
        {stepNumber && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-black dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xs font-black shadow-xl border-4 border-white dark:border-slate-900">
            {stepNumber}
          </div>
        )}
      </div>
      
      <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{title}</h3>
      <p className="text-gray-500 dark:text-slate-400 mt-3 mb-8 max-w-sm mx-auto text-sm leading-relaxed font-medium">{description}</p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="bg-black dark:bg-slate-100 hover:bg-gray-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold py-3 px-8 rounded-xl transition-all shadow-xl shadow-black/5 dark:shadow-white/5 active:scale-95 flex items-center gap-2"
          >
            {actionLabel}
          </button>
        )}
        
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-slate-100 font-bold text-sm px-4 py-2 transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
