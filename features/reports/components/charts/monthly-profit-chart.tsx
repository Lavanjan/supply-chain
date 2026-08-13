"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { formatCompactCurrency } from "@/lib/utils/format";
import { ChartTooltip } from "@/features/dashboard/components/charts/chart-tooltip";
import { ChartEmpty } from "@/features/dashboard/components/charts/chart-empty";
import type { ProfitChartPoint } from "@/types/report.types";

export function MonthlyProfitChart({ data }: { data: ProfitChartPoint[] }) {
  const { chrome, sequentialBlue, sequentialOrange } = useChartTheme();
  const hasData = data.some((point) => point.revenue > 0 || point.cost > 0);

  if (!hasData) return <ChartEmpty message="No revenue or cost of goods in this range" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chrome.gridline} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: chrome.muted, fontSize: 12 }}
          axisLine={{ stroke: chrome.baseline }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: chrome.muted, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => formatCompactCurrency(value)}
          width={56}
        />
        <Tooltip
          cursor={{ stroke: chrome.baseline, strokeWidth: 1 }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              formatValue={formatCompactCurrency}
              payload={payload?.map((entry) => ({
                name: entry.dataKey === "revenue" ? "Revenue" : "Cost of goods",
                value: Number(entry.value),
                color: entry.dataKey === "revenue" ? sequentialOrange : sequentialBlue,
              }))}
            />
          )}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: chrome.textSecondary, fontSize: 12 }}>
              {value === "revenue" ? "Revenue" : "Cost of goods"}
            </span>
          )}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={sequentialOrange}
          strokeWidth={2}
          fill={sequentialOrange}
          fillOpacity={0.1}
          activeDot={{ r: 5, strokeWidth: 2, stroke: chrome.surface }}
        />
        <Area
          type="monotone"
          dataKey="cost"
          stroke={sequentialBlue}
          strokeWidth={2}
          fill={sequentialBlue}
          fillOpacity={0.1}
          activeDot={{ r: 5, strokeWidth: 2, stroke: chrome.surface }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
