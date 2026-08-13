"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, DatePicker, Row, Table, type TableColumnsType } from "antd";
import { DollarOutlined, DownloadOutlined, FallOutlined, RiseOutlined, ShoppingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { MonthlyProfitChart } from "@/features/reports/components/charts/monthly-profit-chart";
import { usePermission } from "@/hooks/use-permission";
import { apiClient } from "@/lib/api/client";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { formatCurrency } from "@/lib/utils/format";
import type { ProfitChartPoint, ProfitReportRow, ProfitReportSummary } from "@/types/report.types";

const { RangePicker } = DatePicker;

interface ProfitReportResponse {
  summary: ProfitReportSummary;
  chart: ProfitChartPoint[];
  rows: ProfitReportRow[];
}

export function ProfitReport() {
  const { can } = usePermission();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [result, setResult] = useState<ProfitReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const filters = useMemo(() => ({ dateFrom, dateTo }), [dateFrom, dateTo]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<ProfitReportResponse>("/api/reports/profit", filters)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  function handleExport() {
    if (!result) return;
    const csv = toCsv(result.rows, [
      { key: "month", label: "Month", value: (row) => row.month },
      { key: "revenue", label: "Revenue", value: (row) => row.revenue },
      { key: "costOfGoods", label: "Cost of Goods", value: (row) => row.costOfGoods },
      { key: "profit", label: "Profit", value: (row) => row.profit },
      { key: "marginPercent", label: "Margin %", value: (row) => row.marginPercent },
    ]);
    downloadCsv(`profit-report-${Date.now()}.csv`, csv);
  }

  const columns: TableColumnsType<ProfitReportRow> = [
    { title: "Month", dataIndex: "month" },
    { title: "Revenue", dataIndex: "revenue", align: "right", render: (value: number) => formatCurrency(value) },
    { title: "Cost of Goods", dataIndex: "costOfGoods", align: "right", render: (value: number) => formatCurrency(value) },
    {
      title: "Profit",
      dataIndex: "profit",
      align: "right",
      render: (value: number) => (
        <span className={value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
          {formatCurrency(value)}
        </span>
      ),
    },
    { title: "Margin %", dataIndex: "marginPercent", align: "right", render: (value: number) => `${value}%` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}>
          <StatCard icon={<DollarOutlined />} label="Total Revenue" value={formatCurrency(result?.summary.totalRevenue ?? 0)} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<ShoppingOutlined />}
            label="Cost of Goods"
            value={formatCurrency(result?.summary.totalCostOfGoods ?? 0)}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<RiseOutlined />}
            label="Gross Profit"
            value={formatCurrency(result?.summary.grossProfit ?? 0)}
            tone={(result?.summary.grossProfit ?? 0) < 0 ? "critical" : "default"}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<FallOutlined />}
            label="Margin %"
            value={`${result?.summary.marginPercent ?? 0}%`}
            tone={(result?.summary.marginPercent ?? 0) < 0 ? "critical" : "default"}
          />
        </Col>
      </Row>

      <Card
        title="Revenue vs. Cost of Goods"
        className="rounded-2xl"
        extra={
          <RangePicker
            value={dateFrom && dateTo ? [dayjs(dateFrom), dayjs(dateTo)] : null}
            onChange={(dates) => {
              if (!dates || !dates[0] || !dates[1]) {
                setDateFrom(undefined);
                setDateTo(undefined);
                return;
              }
              setDateFrom(dates[0].startOf("day").toISOString());
              setDateTo(dates[1].endOf("day").toISOString());
            }}
          />
        }
      >
        <MonthlyProfitChart data={result?.chart ?? []} />
      </Card>

      <Card
        title="Monthly Breakdown"
        className="rounded-2xl"
        extra={
          can("reports.export") && (
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={!result || result.rows.length === 0}
            >
              Export CSV
            </Button>
          )
        }
      >
        <div className="overflow-x-auto">
          <Table<ProfitReportRow>
            columns={columns}
            dataSource={result?.rows ?? []}
            rowKey="month"
            loading={loading}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>
    </div>
  );
}
