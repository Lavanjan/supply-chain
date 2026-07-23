"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { ProductOption } from "@/types/product.types";

interface ProductFormOptions {
  categories: ProductOption[];
  units: ProductOption[];
}

export function useProductOptions() {
  const [options, setOptions] = useState<ProductFormOptions>({ categories: [], units: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<ProductFormOptions>("/api/products/options")
      .then((result) => {
        if (!cancelled) setOptions(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...options, loading };
}
