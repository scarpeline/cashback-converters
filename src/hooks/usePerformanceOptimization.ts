import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook para memoizar cálculos pesados
export function useMemoizedCalculation<T, R>(
  data: T,
  calculate: (data: T) => R,
  dependencies: any[] = []
): R {
  return useMemo(() => calculate(data), [data, ...dependencies]);
}

// Hook para debounce de funções
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  return useCallback(
    debounce((...args: Parameters<T>) => {
      callback(...args);
    }, delay),
    [callback, delay]
  ) as T;
}

// Função debounce simples
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Hook para throttling
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  limit: number
): T {
  return useCallback(
    throttle((...args: Parameters<T>) => {
      callback(...args);
    }, limit),
    [callback, limit]
  ) as T;
}

// Função throttle simples
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Hook para memoizar listas grandes
export function useMemoizedList<T>(
  items: T[],
  filterFn?: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number
): T[] {
  return useMemo(() => {
    let filtered = filterFn ? items.filter(filterFn) : items;
    if (sortFn) {
      filtered = [...filtered].sort(sortFn);
    }
    return filtered;
  }, [items, filterFn, sortFn]);
}

// Hook para paginação otimizada
export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(items.length / itemsPerPage);
  }, [items.length, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

// Hook para search otimizado
export function useSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 300
) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerSearchTerm);
      })
    );
  }, [items, searchTerm, searchFields]);

  const debouncedSearch = useDebouncedCallback(setSearchTerm, debounceMs);

  return {
    searchTerm,
    setSearchTerm: debouncedSearch,
    filteredItems,
  };
}

// Hook para virtual scrolling (para listas muito grandes)
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight,
      totalHeight: items.length * itemHeight,
    };
  }, [items, scrollTop, itemHeight, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
  };
}

// Hook para memoizar objetos complexos
export function useMemoizedObject<T extends Record<string, any>>(
  obj: T,
  dependencies: (keyof T)[] = Object.keys(obj) as (keyof T)[]
): T {
  return useMemo(() => {
    const result = {} as T;
    dependencies.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }, [obj, ...dependencies.map(key => obj[key])]);
}

// Hook para otimizar re-renders em componentes grandes
export function useOptimizedRender<T>(
  value: T,
  areEqual: (prev: T, next: T) => boolean = Object.is
) {
  const ref = useRef<T>(value);
  
  if (!areEqual(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}
