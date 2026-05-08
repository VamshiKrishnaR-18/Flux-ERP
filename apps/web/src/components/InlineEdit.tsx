import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

interface InlineEditProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  type?: 'text' | 'number';
  className?: string;
}

export function InlineEdit({ value, onSave, type = 'text', className = '' }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (inputValue === value) {
      setIsEditing(false);
      return;
    }
    setIsLoading(true);
    try {
      await onSave(inputValue);
      setIsEditing(false);
    } catch {
      setInputValue(value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setInputValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <input
          ref={inputRef}
          type={type}
          value={inputValue}
          onChange={(e) => setInputValue(type === 'number' ? Number(e.target.value) : e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-md outline-none text-sm shadow-[0_0_0_2px_rgba(59,130,246,0.1)] dark:shadow-[0_0_0_2px_rgba(59,130,246,0.05)]"
        />
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 dark:text-blue-400" />
        ) : (
          <div className="flex items-center gap-0.5">
             <button onMouseDown={handleSave} className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded">
                <Check className="w-3.5 h-3.5" />
             </button>
             <button onMouseDown={() => setIsEditing(false)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded">
                <X className="w-3.5 h-3.5" />
             </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-100/50 dark:hover:bg-slate-800/50 px-2 -mx-2 py-1 rounded-md transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700 group relative ${className}`}
    >
      <span className="truncate block dark:text-gray-300 group-hover:dark:text-gray-100">{value}</span>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
      </div>
    </div>
  );
}
