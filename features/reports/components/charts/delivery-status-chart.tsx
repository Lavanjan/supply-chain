"use client";

import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { formatNumber } from "@/lib/utils/format";
import { CHART_STATUS } from "@/lib/constants/chart-palette";
import { ChartTooltip } from "@/features/dashboard/components/charts/chart-tooltip";
import { ChartEmpty } from "@/features/dashboard/components/charts/chart-empty";
import type { DeliveryStatusPoint } from "@/types/report.types";

const STATUS_COLOR_KEY: Record<string, keyof typeof CHART_STATUS> = {
  Pending: "warning",
  Delivered: "good",
  Cancelled: "critical",
};

export function DeliveryStatusChart({ data }: { data: DeliveryStatusPoint[] }) {
  const { mode, chrome } = useChartTheme();
  const hasData = data.some((point) => point.count > 0);

  if (!hasData) return <ChartEmpty message="No deliveries in this range" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chrome.gridline} vertical={false} />
        <XAxis dataKey="status" tick={{ fill: chrome.muted, fontSize: 12 }} axisLine={{ stroke: chrome.baseline }} tickLine={false} />
        <YAxis tick={{ fill: chrome.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: chrome.gridline, opacity: 0.4 }}
          content={({ active, label, payload }) => (
            <ChartTooltip
              active={active}
              label={label}
              formatValue={formatNumber}
              payload={payload?.map((entry) => ({
                name: "Deliveries",
                value: Number(entry.value),
                color: CHART_STATUS[STATUS_COLOR_KEY[String(label)] ?? "good"][mode],
              }))}
            />
          )}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((point) => (
            <Cell key={point.status} fill={CHART_STATUS[STATUS_COLOR_KEY[point.status] ?? "good"][mode]} />
          ))}
          <LabelList dataKey="count" position="top" style={{ fill: chrome.textSecondary, fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
