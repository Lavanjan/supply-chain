"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { WarehouseOption } from "@/types/warehouse.types";

export interface SupplierOption {
  id: string;
  companyName: string;
}

export interface ProductPriceOption {
  id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  unitSymbol: string;
}

export function usePurchaseOrderOptions() {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [products, setProducts] = useState<ProductPriceOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get<SupplierOption[]>("/api/suppliers/options"),
      apiClient.get<WarehouseOption[]>("/api/warehouses/options"),
      apiClient.get<ProductPriceOption[]>("/api/products/select-options"),
    ])
      .then(([supplierResult, warehouseResult, productResult]) => {
        if (cancelled) return;
        setSuppliers(supplierResult);
        setWarehouses(warehouseResult);
        setProducts(productResult);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { suppliers, warehouses, products, loading };
}
