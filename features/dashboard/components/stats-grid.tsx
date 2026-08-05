"use client";

import {
  CarOutlined,
  DatabaseOutlined,
  DollarOutlined,
  FileTextOutlined,
  ShopOutlined,
  ShoppingOutlined,
  StopOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { formatCompactCurrency, formatCompactNumber, formatNumber } from "@/lib/utils/format";
import type { DashboardStats } from "@/types/dashboard.types";

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const t = useTranslations("dashboard.stats");

  const cards = [
    {
      icon: <ShoppingOutlined />,
      label: t("totalProducts"),
      value: formatNumber(stats.totalProducts),
    },
    {
      icon: <DatabaseOutlined />,
      label: t("currentInventory"),
      value: formatCompactNumber(stats.currentInventoryUnits),
    },
    {
      icon: <DollarOutlined />,
      label: t("inventoryValue"),
      value: formatCompactCurrency(stats.inventoryValue),
    },
    {
      icon: <WarningOutlined />,
      label: t("lowStock"),
      value: formatNumber(stats.lowStockCount),
      tone: "warning" as const,
    },
    {
      icon: <StopOutlined />,
      label: t("outOfStock"),
      value: formatNumber(stats.outOfStockCount),
      tone: "critical" as const,
    },
    {
      icon: <ShopOutlined />,
      label: t("suppliers"),
      value: formatNumber(stats.supplierCount),
    },
    {
      icon: <TeamOutlined />,
      label: t("customers"),
      value: formatNumber(stats.customerCount),
    },
    {
      icon: <FileTextOutlined />,
      label: t("purchaseOrders"),
      value: formatNumber(stats.purchaseOrderCount),
    },
    {
      icon: <CarOutlined />,
      label: t("todaysDeliveries"),
      value: formatNumber(stats.todaysDeliveriesCount),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
