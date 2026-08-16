"use client";

import { useEffect, useState } from "react";
import { Alert, Card, Skeleton } from "antd";
import { useTranslations } from "next-intl";
import { MonthlyPurchasesChart } from "@/features/dashboard/components/charts/monthly-purchases-chart";
import { InventoryMovementChart } from "@/features/dashboard/components/charts/inventory-movement-chart";
import { TopProductsChart } from "@/features/dashboard/components/charts/top-products-chart";
import { TopSuppliersChart } from "@/features/dashboard/components/charts/top-suppliers-chart";
import type { DashboardChartsPayload } from "@/types/dashboard.types";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card title={title} className="rounded-2xl">
      {children}
    </Card>
  );
}

export function DashboardCharts() {
  const t = useTranslations("dashboard.charts");
  const [data, setData] = useState<DashboardChartsPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/dashboard/charts")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load charts");
        return response.json();
      })
      .then((payload: DashboardChartsPayload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <Alert type="error" showIcon message={t("loadErrorTitle")} description={t("loadErrorDescription")} />;
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="rounded-2xl">
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <ChartCard title={t("monthlyPurchases")}>
        <MonthlyPurchasesChart data={data.monthlyPurchases} />
      </ChartCard>
      <ChartCard title={t("inventoryMovement")}>
        <InventoryMovementChart data={data.inventoryMovement} />
      </ChartCard>
      <ChartCard title={t("topProductsByStock")}>
        <TopProductsChart data={data.topProducts} />
      </ChartCard>
      <ChartCard title={t("topSuppliersByOrders")}>
        <TopSuppliersChart data={data.topSuppliers} />
      </ChartCard>
    </div>
  );
}
