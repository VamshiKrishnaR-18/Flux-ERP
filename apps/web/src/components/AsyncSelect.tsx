import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Loader2, Search, X, ChevronDown } from 'lucide-react';

interface AsyncSelectProps<T> {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  fetcher: (query: string) => Promise<T[]>;
  renderOption: (item: T) => React.ReactNode;
  placeholder?: string;
  error?: string;
  initialLabel?: string; 
  getOptionLabel: (item: T) => string;
  name?: string;
  id?: string;
}

export function AsyncSelect<T extends { _id: string }>({ 
  label, 
  value, 
  onChange, 
  fetcher, 
  renderOption,
  placeholder = "Search...",
  error,
  initialLabel,
  getOptionLabel,
  name,
  id
}: AsyncSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel || '');
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 500);

  const internalId = id || `async-select-${Math.random().toString(36).substr(2, 9)}`;
  const searchInputId = `search-${internalId}`;

  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  useEffect(() => {
    if (!isOpen) return; 
    
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const results = await fetcher(debouncedQuery);
        if (active) setOptions(results);
      } catch (err) {
        console.error(err);
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [debouncedQuery, isOpen, fetcher]);

  const handleSelect = (item: T) => {
    onChange(item._id);
    setSelectedLabel(getOptionLabel(item));
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedLabel('');
    setQuery('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label htmlFor={internalId} className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{label}</label>}
      
      {/* Trigger Input */}
      <div 
        id={internalId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`listbox-${internalId}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
          if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full border p-2 rounded-lg cursor-pointer bg-white dark:bg-slate-900 transition-all outline-none
          ${error ? 'border-red-500 ring-1 ring-red-100 dark:ring-red-900/20' : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'}
          ${isOpen ? 'ring-2 ring-blue-100 dark:ring-blue-900/20 border-blue-400 dark:border-blue-500' : 'focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-400'}
        `}
      >
        <span className={`text-sm ${selectedLabel ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-slate-500'}`}>
          {selectedLabel || placeholder}
        </span>
        
        <div className="flex items-center gap-2">
          {value && (
            <button 
              type="button"
              aria-label="Clear selection"
              onClick={handleClear} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 dark:text-slate-500"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className="text-gray-400 dark:text-slate-500" />
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          id={`listbox-${internalId}`}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg shadow-xl dark:shadow-2xl dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
            <div className="relative">
              <label htmlFor={searchInputId} className="sr-only">Search</label>
              <Search className="absolute left-2 top-2.5 text-gray-400 dark:text-slate-500" size={14} />
              <input
                autoFocus
                id={searchInputId}
                name={`${name || internalId}-search`}
                type="text"
                autoComplete="off"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-gray-100 dark:placeholder-slate-500"
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400 dark:text-slate-500 flex items-center justify-center gap-2 text-sm">
                <Loader2 className="animate-spin" size={16} /> Loading...
              </div>
            ) : options.length > 0 ? (
              options.map((item) => (
                <div
                  key={item._id}
                  role="option"
                  aria-selected={value === item._id}
                  onClick={() => handleSelect(item)}
                  className="px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer text-sm border-b border-gray-50 dark:border-slate-800/50 last:border-0 transition-colors dark:text-slate-100"
                >
                  {renderOption(item)}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 dark:text-slate-500 text-sm">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}