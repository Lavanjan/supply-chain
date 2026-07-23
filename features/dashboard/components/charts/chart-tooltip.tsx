"use client";

import { useChartTheme } from "@/hooks/use-chart-theme";

interface ChartTooltipEntry {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipEntry[];
  formatValue?: (value: number) => string;
}

export function ChartTooltip({ active, label, payload, formatValue }: ChartTooltipProps) {
  const { chrome } = useChartTheme();

  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-lg"
      style={{
        backgroundColor: chrome.surface,
        border: `1px solid ${chrome.gridline}`,
        color: chrome.textPrimary,
      }}
    >
      {label && (
        <div className="mb-1 text-xs" style={{ color: chrome.textSecondary }}>
          {label}
        </div>
      )}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-3 shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span style={{ color: chrome.textSecondary }}>{entry.name}</span>
          <span className="ml-auto font-semibold tabular-nums" style={{ color: chrome.textPrimary }}>
            {formatValue ? formatValue(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
