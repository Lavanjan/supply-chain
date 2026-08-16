"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { formatNumber } from "@/lib/utils/format";
import { ChartTooltip } from "@/features/dashboard/components/charts/chart-tooltip";
import { ChartEmpty } from "@/features/dashboard/components/charts/chart-empty";
import type { TopSupplierPoint } from "@/types/dashboard.types";

export function TopSuppliersChart({ data }: { data: TopSupplierPoint[] }) {
  const { chrome, sequentialOrange } = useChartTheme();

  if (data.length === 0) return <ChartEmpty message="No purchase orders to rank suppliers yet" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 32, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={chrome.gridline} horizontal={false} />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: chrome.textSecondary, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          cursor={{ fill: chrome.gridline, opacity: 0.4 }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              formatValue={formatNumber}
              payload={payload?.map((entry) => ({
                name: "Orders",
                value: Number(entry.value),
                color: sequentialOrange,
              }))}
            />
          )}
        />
        <Bar dataKey="count" fill={sequentialOrange} radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList
            dataKey="count"
            position="right"
            formatter={(value: unknown) => formatNumber(Number(value))}
            style={{ fill: chrome.textSecondary, fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
