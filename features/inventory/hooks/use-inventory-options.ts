"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { WarehouseOption } from "@/types/warehouse.types";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

export function useInventoryOptions() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get<ProductOption[]>("/api/products/select-options"),
      apiClient.get<WarehouseOption[]>("/api/warehouses/options"),
    ])
      .then(([productsResult, warehousesResult]) => {
        if (cancelled) return;
        setProducts(productsResult);
        setWarehouses(warehousesResult);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, warehouses, loading };
}
