"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { PurchaseOrderReceivableOption, ReceivablePurchaseOrder } from "@/types/goods-receive-note.types";

export function useReceivablePurchaseOrderOptions() {
  const [options, setOptions] = useState<PurchaseOrderReceivableOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<PurchaseOrderReceivableOption[]>("/api/purchase-orders/receivable")
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

  return { options, loading };
}

export function useReceivingDetail(purchaseOrderId: string | undefined) {
  const [detail, setDetail] = useState<ReceivablePurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!purchaseOrderId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<ReceivablePurchaseOrder>(`/api/purchase-orders/${purchaseOrderId}/receiving-detail`)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [purchaseOrderId]);

  return { detail, loading };
}
