"use client";

import type { ReactNode } from "react";
import { Card, Typography } from "antd";

type StatTone = "default" | "warning" | "critical";

const TONE_STYLES: Record<StatTone, { bg: string; fg: string }> = {
  default: { bg: "rgba(42,120,214,0.12)", fg: "#2a78d6" },
  warning: { bg: "rgba(250,178,25,0.15)", fg: "#b8790a" },
  critical: { bg: "rgba(208,59,59,0.12)", fg: "#d03b3b" },
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: StatTone;
}

export function StatCard({ icon, label, value, tone = "default" }: StatCardProps) {
  const style = TONE_STYLES[tone];

  return (
    <Card className="rounded-2xl h-full" styles={{ body: { padding: "1.1rem 1.25rem" } }}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: style.bg, color: style.fg }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <Typography.Text type="secondary" className="text-xs block leading-tight">
            {label}
          </Typography.Text>
          <Typography.Title level={4} className="!mb-0 !mt-0.5 truncate">
            {value}
          </Typography.Title>
        </div>
      </div>
    </Card>
  );
}
