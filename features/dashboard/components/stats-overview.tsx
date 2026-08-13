"use client";

import type { ReactNode } from "react";
import { Card, Typography } from "antd";
import {
  CarOutlined,
  DollarOutlined,
  FileTextOutlined,
  RiseOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { formatCompactCurrency, formatNumber } from "@/lib/utils/format";
import type { DashboardStats } from "@/types/dashboard.types";

function tint(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface HeroStatProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle: string;
  accent: string;
}

function HeroStat({ icon, label, value, subtitle, accent }: HeroStatProps) {
  return (
    <Card className="rounded-2xl h-full" styles={{ body: { padding: "1.25rem 1.5rem" } }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography.Text type="secondary" className="text-xs block leading-tight">
            {label}
          </Typography.Text>
          <div className="text-3xl font-semibold leading-tight mt-1 truncate" style={{ fontVariantNumeric: "proportional-nums" }}>
            {value}
          </div>
          <Typography.Text type="secondary" className="text-xs block mt-1.5 truncate">
            {subtitle}
          </Typography.Text>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: tint(accent, 0.14), color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="h-1 rounded-full mt-4" style={{ backgroundColor: tint(accent, 0.14) }}>
        <div className="h-1 rounded-full" style={{ width: "100%", backgroundColor: accent, opacity: 0.9 }} />
      </div>
    </Card>
  );
}

interface CompactStatProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function CompactStat({ icon, label, value }: CompactStatProps) {
  const { chrome } = useChartTheme();
  return (
    <Card className="rounded-2xl h-full" styles={{ body: { padding: "1rem 1.25rem" } }}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
          style={{ backgroundColor: tint(chrome.muted, 0.16), color: chrome.textSecondary }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <Typography.Text type="secondary" className="text-xs block leading-tight">
            {label}
          </Typography.Text>
          <div className="text-xl font-semibold leading-tight mt-0.5 truncate">{value}</div>
        </div>
      </div>
    </Card>
  );
}

interface StockHealthCardProps {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

function StockHealthCard({ totalProducts, lowStockCount, outOfStockCount }: StockHealthCardProps) {
  const { status, chrome } = useChartTheme();
  const t = useTranslations("dashboard.stats");
  const healthyCount = Math.max(totalProducts - lowStockCount - outOfStockCount, 0);
  const denominator = totalProducts > 0 ? totalProducts : 1;

  const segments = [
    { key: "healthy", label: t("healthy"), count: healthyCount, color: status.good },
    { key: "lowStock", label: t("lowStock"), count: lowStockCount, color: status.warning },
    { key: "outOfStock", label: t("outOfStock"), count: outOfStockCount, color: status.critical },
  ];

  return (
    <Card className="rounded-2xl h-full" styles={{ body: { padding: "1.25rem 1.5rem" } }}>
      <div className="flex items-baseline justify-between gap-2">
        <Typography.Text strong className="text-sm">
          {t("stockHealth")}
        </Typography.Text>
        <Typography.Text type="secondary" className="text-xs">
          {t("productsCount", { count: formatNumber(totalProducts) })}
        </Typography.Text>
      </div>

      <div className="flex gap-0.5 mt-4 h-3.5">
        {segments.map((segment, index) => {
          const pct = (segment.count / denominator) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={segment.key}
              className={`h-full ${index === 0 ? "rounded-l-full" : ""} ${
                index === segments.length - 1 ? "rounded-r-full" : ""
              }`}
              style={{ width: `${pct}%`, backgroundColor: segment.color }}
              title={`${segment.label}: ${formatNumber(segment.count)}`}
            />
          );
        })}
        {totalProducts === 0 && (
          <div className="h-full w-full rounded-full" style={{ backgroundColor: chrome.gridline }} />
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: segment.color }} />
            <Typography.Text type="secondary" className="text-xs">
              {segment.label} · {formatNumber(segment.count)}
            </Typography.Text>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StatsOverview({ stats }: { stats: DashboardStats }) {
  const t = useTranslations("dashboard.stats");
  const { categorical } = useChartTheme();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <HeroStat
          icon={<ShoppingOutlined />}
          label={t("totalProducts")}
          value={formatNumber(stats.totalProducts)}
          subtitle={t("unitsInStock", { count: formatNumber(stats.currentInventoryUnits) })}
          accent={categorical[0]}
        />
        <HeroStat
          icon={<DollarOutlined />}
          label={t("inventoryValue")}
          value={formatCompactCurrency(stats.inventoryValue)}
          subtitle={t("acrossWarehouses")}
          accent={categorical[1]}
        />
        <HeroStat
          icon={<RiseOutlined />}
          label={t("totalRevenue")}
          value={formatCompactCurrency(stats.totalRevenue)}
          subtitle={t("fromDeliveries")}
          accent={categorical[5]}
        />
        <HeroStat
          icon={<FileTextOutlined />}
          label={t("purchaseOrders")}
          value={formatNumber(stats.purchaseOrderCount)}
          subtitle={t("allTimeOrders")}
          accent={categorical[6]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2">
          <StockHealthCard
            totalProducts={stats.totalProducts}
            lowStockCount={stats.lowStockCount}
            outOfStockCount={stats.outOfStockCount}
          />
        </div>
        <CompactStat icon={<ShopOutlined />} label={t("suppliers")} value={formatNumber(stats.supplierCount)} />
        <CompactStat icon={<TeamOutlined />} label={t("customers")} value={formatNumber(stats.customerCount)} />
        <CompactStat icon={<CarOutlined />} label={t("todaysDeliveries")} value={formatNumber(stats.todaysDeliveriesCount)} />
      </div>
    </div>
  );
}
