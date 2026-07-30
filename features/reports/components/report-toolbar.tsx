"use client";

import type { ReactNode } from "react";
import { Button, Input } from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/use-permission";

interface ReportToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  onExport: () => void;
  exportDisabled?: boolean;
}

export function ReportToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  onExport,
  exportDisabled,
}: ReportToolbarProps) {
  const { can } = usePermission();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <Input
        allowClear
        placeholder={searchPlaceholder}
        prefix={<SearchOutlined className="text-neutral-400" />}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:max-w-xs"
      />
      {filters}
      {can("reports.export") && (
        <div className="sm:ml-auto">
          <Button icon={<DownloadOutlined />} onClick={onExport} disabled={exportDisabled}>
            Export CSV
          </Button>
        </div>
      )}
    </div>
  );
}
