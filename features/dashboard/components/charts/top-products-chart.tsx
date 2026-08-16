"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { formatCompactNumber } from "@/lib/utils/format";
import { ChartTooltip } from "@/features/dashboard/components/charts/chart-tooltip";
import { ChartEmpty } from "@/features/dashboard/components/charts/chart-empty";
import type { TopProductPoint } from "@/types/dashboard.types";

export function TopProductsChart({ data }: { data: TopProductPoint[] }) {
  const { chrome, sequentialBlue } = useChartTheme();

  if (data.length === 0) return <ChartEmpty message="No stock to rank yet" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 32, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={chrome.gridline} horizontal={false} />
        <XAxis type="number" hide />
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
              formatValue={formatCompactNumber}
              payload={payload?.map((entry) => ({
                name: "Stock quantity",
                value: Number(entry.value),
                color: sequentialBlue,
              }))}
            />
          )}
        />
        <Bar dataKey="quantity" fill={sequentialBlue} radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList
            dataKey="quantity"
            position="right"
            formatter={(value: unknown) => formatCompactNumber(Number(value))}
            style={{ fill: chrome.textSecondary, fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
