"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { WarehouseOption } from "@/types/warehouse.types";
import type { ProductOption } from "@/types/product.types";

interface SupplierOption {
  id: string;
  companyName: string;
}

interface CustomerOption {
  id: string;
  companyName: string;
}

interface ProductFormOptions {
  categories: ProductOption[];
  units: ProductOption[];
}

interface FilterOptions {
  categories: ProductOption[];
  warehouses: WarehouseOption[];
  suppliers: SupplierOption[];
  customers: CustomerOption[];
  products: { id: string; name: string; sku: string }[];
}

const EMPTY: FilterOptions = { categories: [], warehouses: [], suppliers: [], customers: [], products: [] };

export function useReportFilterOptions() {
  const [options, setOptions] = useState<FilterOptions>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get<ProductFormOptions>("/api/products/options"),
      apiClient.get<WarehouseOption[]>("/api/warehouses/options"),
      apiClient.get<SupplierOption[]>("/api/suppliers/options"),
      apiClient.get<{ id: string; companyName: string; address: string | null }[]>("/api/customers/options"),
      apiClient.get<{ id: string; name: string; sku: string }[]>("/api/products/select-options"),
    ])
      .then(([productOptions, warehouses, suppliers, customers, products]) => {
        if (cancelled) return;
        setOptions({ categories: productOptions.categories, warehouses, suppliers, customers, products });
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
