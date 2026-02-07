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
  getOptionLabel
}: AsyncSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel || '');
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 500);

  
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
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      
      {/* Trigger Input */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full border p-2 rounded-lg cursor-pointer bg-white transition-all
          ${error ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-200 hover:border-gray-300'}
          ${isOpen ? 'ring-2 ring-blue-100 border-blue-400' : ''}
        `}
      >
        <span className={`text-sm ${selectedLabel ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedLabel || placeholder}
        </span>
        
        <div className="flex items-center gap-2">
          {value && (
            <div onClick={handleClear} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
              <X size={14} />
            </div>
          )}
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-gray-400" size={14} />
              <input
                autoFocus
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400 flex items-center justify-center gap-2 text-sm">
                <Loader2 className="animate-spin" size={16} /> Loading...
              </div>
            ) : options.length > 0 ? (
              options.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelect(item)}
                  className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 transition-colors"
                >
                  {renderOption(item)}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}