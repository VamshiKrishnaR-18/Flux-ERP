import { useState, useMemo } from 'react';

export const useSearch = <T>(items: T[], searchKeys: string[]) => {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();

    return items.filter((item) => {
      return searchKeys.some((key) => {
        
        const value = key.split('.').reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], item);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }, [items, query, searchKeys]);

  return { query, setQuery, filteredItems };
};