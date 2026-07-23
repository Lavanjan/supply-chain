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
import { StatCard } from "@/features/dashboard/components/stat-card";
import { formatCompactCurrency, formatCompactNumber, formatNumber } from "@/lib/utils/format";
import type { DashboardStats } from "@/types/dashboard.types";

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      icon: <ShoppingOutlined />,
      label: "Total Products",
      value: formatNumber(stats.totalProducts),
    },
    {
      icon: <DatabaseOutlined />,
      label: "Current Inventory",
      value: formatCompactNumber(stats.currentInventoryUnits),
    },
    {
      icon: <DollarOutlined />,
      label: "Inventory Value",
      value: formatCompactCurrency(stats.inventoryValue),
    },
    {
      icon: <WarningOutlined />,
      label: "Low Stock",
      value: formatNumber(stats.lowStockCount),
      tone: "warning" as const,
    },
    {
      icon: <StopOutlined />,
      label: "Out Of Stock",
      value: formatNumber(stats.outOfStockCount),
      tone: "critical" as const,
    },
    {
      icon: <ShopOutlined />,
      label: "Suppliers",
      value: formatNumber(stats.supplierCount),
    },
    {
      icon: <TeamOutlined />,
      label: "Customers",
      value: formatNumber(stats.customerCount),
    },
    {
      icon: <FileTextOutlined />,
      label: "Purchase Orders",
      value: formatNumber(stats.purchaseOrderCount),
    },
    {
      icon: <CarOutlined />,
      label: "Today's Deliveries",
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
