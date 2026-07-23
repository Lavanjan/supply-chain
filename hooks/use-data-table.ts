"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/api.types";

const SEARCH_DEBOUNCE_MS = 350;

interface UseDataTableOptions {
  endpoint: string;
  pageSize?: number;
  extraParams?: Record<string, string | undefined>;
}

export function useDataTable<T>({ endpoint, pageSize = 10, extraParams }: UseDataTableOptions) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | undefined>();
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const extraParamsKey = JSON.stringify(extraParams ?? {});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient
      .get<PaginatedResult<T>>(endpoint, {
        page,
        pageSize,
        search: search || undefined,
        sortField,
        sortOrder,
        ...extraParams,
      })
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setTotal(result.total);
      })
      .catch(() => {
        if (!cancelled) {
          setData([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, pageSize, search, sortField, sortOrder, reloadToken, extraParamsKey]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const handleSortChange = useCallback((field?: string, order?: "ascend" | "descend") => {
    setSortField(field);
    setSortOrder(order);
  }, []);

  return {
    data,
    total,
    page,
    setPage,
    pageSize,
    searchInput,
    setSearchInput,
    sortField,
    sortOrder,
    setSort: handleSortChange,
    loading,
    reload,
  };
}
