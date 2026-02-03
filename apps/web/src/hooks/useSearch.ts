import { useState, useMemo } from 'react';

export const useSearch = <T>(items: T[], searchKeys: string[]) => {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();

    return items.filter((item) => {
      return searchKeys.some((key) => {
        // Handle nested keys (e.g. "clientId.name")
        const value = key.split('.').reduce((obj: any, k) => obj?.[k], item);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }, [items, query, searchKeys]);

  return { query, setQuery, filteredItems };
};