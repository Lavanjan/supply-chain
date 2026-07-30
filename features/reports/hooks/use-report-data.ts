"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { ReportResult } from "@/types/report.types";

interface UseReportDataOptions {
  endpoint: string;
  filters: Record<string, string | undefined>;
  pageSize?: number;
}

export function useReportData<TRow, TSummary, TChartPoint>({
  endpoint,
  filters,
  pageSize = 10,
}: UseReportDataOptions) {
  const [result, setResult] = useState<ReportResult<TRow, TSummary, TChartPoint> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient
      .get<ReportResult<TRow, TSummary, TChartPoint>>(endpoint, { page, pageSize, ...filters })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, pageSize, filtersKey]);

  return { result, page, setPage, loading };
}
