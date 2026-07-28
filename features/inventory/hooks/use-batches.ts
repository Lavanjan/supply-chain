"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { InventoryBatchOption } from "@/types/inventory.types";

export function useBatches(productId: string | undefined, warehouseId: string | undefined) {
  const [batches, setBatches] = useState<InventoryBatchOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId || !warehouseId) {
      setBatches([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<InventoryBatchOption[]>("/api/inventory/batches", { productId, warehouseId })
      .then((result) => {
        if (!cancelled) setBatches(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, warehouseId]);

  return { batches, loading };
}
