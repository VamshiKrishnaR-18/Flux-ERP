import { Info } from 'lucide-react';

export function DemoModeBanner() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200/70 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
      <Info className="w-3.5 h-3.5 shrink-0" />
      <span>
        <span className="font-semibold">Demo mode</span>
        {' — '}
        All data shown is for demonstration purposes only.
      </span>
    </div>
  );
}
