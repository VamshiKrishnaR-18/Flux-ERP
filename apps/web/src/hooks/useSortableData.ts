import { useState, useMemo } from 'react';

type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
};

export const useSortableData = <T>(items: T[], config: SortConfig | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(config);

  const sortedItems = useMemo(() => {
    const sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a: T, b: T) => {
        // Handle nested properties (e.g. 'client.name')
        const getValue = (obj: T, path: string) => {
           return path.split('.').reduce((o: unknown, i) => (o ? (o as Record<string, unknown>)[i] : null), obj);
        };

        const aValue = getValue(a, sortConfig.key) as string | number;
        const bValue = getValue(b, sortConfig.key) as string | number;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};