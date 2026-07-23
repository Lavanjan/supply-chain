"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { formatNumber } from "@/lib/utils/format";
import { ChartTooltip } from "@/features/dashboard/components/charts/chart-tooltip";
import { ChartEmpty } from "@/features/dashboard/components/charts/chart-empty";
import type { InventoryMovementPoint } from "@/types/dashboard.types";

export function InventoryMovementChart({ data }: { data: InventoryMovementPoint[] }) {
  const { chrome, categorical } = useChartTheme();
  const [stockInColor, stockOutColor] = categorical;
  const hasData = data.some((point) => point.stockIn > 0 || point.stockOut > 0);

  if (!hasData) return <ChartEmpty message="No stock movement in the last 14 days" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke={chrome.gridline} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: chrome.muted, fontSize: 12 }}
          axisLine={{ stroke: chrome.baseline }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: chrome.muted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ fill: chrome.gridline, opacity: 0.4 }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              formatValue={formatNumber}
              payload={payload?.map((entry) => ({
                name: entry.name === "stockIn" ? "Stock in" : "Stock out",
                value: Number(entry.value),
                color: entry.color as string,
              }))}
            />
          )}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: chrome.textSecondary, fontSize: 12 }}>
              {value === "stockIn" ? "Stock in" : "Stock out"}
            </span>
          )}
        />
        <Bar dataKey="stockIn" fill={stockInColor} radius={[4, 4, 0, 0]} maxBarSize={20} />
        <Bar dataKey="stockOut" fill={stockOutColor} radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
