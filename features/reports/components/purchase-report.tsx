"use client";

import { useMemo, useState } from "react";
import { Card, Col, DatePicker, Row, Select, Tag, Typography, type TableColumnsType } from "antd";
import { CheckCircleOutlined, DollarOutlined, FileTextOutlined, RiseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { MonthlySpendChart } from "@/features/reports/components/charts/monthly-spend-chart";
import { ReportTable } from "@/features/reports/components/report-table";
import { ReportToolbar } from "@/features/reports/components/report-toolbar";
import { useReportData } from "@/features/reports/hooks/use-report-data";
import { useReportFilterOptions } from "@/features/reports/hooks/use-report-filter-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { MonthlySpendPoint, PurchaseReportRow, PurchaseReportSummary } from "@/types/report.types";

const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

export function PurchaseReport() {
  const { suppliers, loading: optionsLoading } = useReportFilterOptions();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();

  const filters = useMemo(
    () => ({ search: search || undefined, supplierId, status, dateFrom, dateTo }),
    [search, supplierId, status, dateFrom, dateTo],
  );

  const { result, page, setPage, loading } = useReportData<PurchaseReportRow, PurchaseReportSummary, MonthlySpendPoint>({
    endpoint: "/api/reports/purchases",
    filters,
  });

  function handleExport() {
    if (!result) return;
    const csv = toCsv(result.data, [
      { key: "poNumber", label: "PO Number", value: (row) => row.poNumber },
      { key: "supplierName", label: "Supplier", value: (row) => row.supplierName },
      { key: "orderDate", label: "Order Date", value: (row) => dayjs(row.orderDate).format("YYYY-MM-DD") },
      { key: "status", label: "Status", value: (row) => row.status },
      { key: "itemCount", label: "Items", value: (row) => row.itemCount },
      { key: "totalAmount", label: "Total Amount", value: (row) => row.totalAmount },
    ]);
    downloadCsv(`purchase-report-${Date.now()}.csv`, csv);
  }

  const columns: TableColumnsType<PurchaseReportRow> = [
    { title: "PO Number", dataIndex: "poNumber" },
    { title: "Supplier", dataIndex: "supplierName" },
    { title: "Order Date", dataIndex: "orderDate", render: (value: string) => dayjs(value).format("MMM D, YYYY") },
    { title: "Items", dataIndex: "itemCount", align: "right" },
    { title: "Total", dataIndex: "totalAmount", align: "right", render: (value: number) => formatCurrency(value) },
    {
      title: "Status",
      dataIndex: "status",
      render: (value: string) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}>
          <StatCard icon={<FileTextOutlined />} label="Total Orders" value={formatNumber(result?.summary.totalOrders ?? 0)} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard icon={<DollarOutlined />} label="Total Spend" value={formatCurrency(result?.summary.totalSpend ?? 0)} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<RiseOutlined />}
            label="Avg. Order Value"
            value={formatCurrency(result?.summary.averageOrderValue ?? 0)}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label="Completed"
            value={formatNumber(result?.summary.completedCount ?? 0)}
          />
        </Col>
      </Row>

      <Card title="Purchase Spend Over Time" className="rounded-2xl">
        <MonthlySpendChart data={result?.chart ?? []} />
      </Card>

      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3">
          <ReportToolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search PO number or supplier..."
            onExport={handleExport}
            exportDisabled={!result || result.data.length === 0}
            filters={
              <>
                <Select
                  allowClear
                  placeholder="Supplier"
                  className="w-full sm:w-44"
                  loading={optionsLoading}
                  value={supplierId}
                  onChange={setSupplierId}
                  options={suppliers.map((s) => ({ value: s.id, label: s.companyName }))}
                />
                <Select
                  allowClear
                  placeholder="Status"
                  className="w-full sm:w-40"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "DRAFT", label: "Draft" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                />
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
              </>
            }
          />

          <ReportTable<PurchaseReportRow>
            columns={columns}
            dataSource={result?.data ?? []}
            rowKey="id"
            loading={loading}
            total={result?.total ?? 0}
            page={page}
            pageSize={result?.pageSize ?? 10}
            onPageChange={setPage}
            emptyText="No purchase orders found"
            renderMobileCard={(row) => (
              <Card size="small" className="rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Typography.Text strong className="block">
                      {row.poNumber}
                    </Typography.Text>
                    <span className="text-xs text-neutral-500">{row.supplierName}</span>
                  </div>
                  <Tag color={STATUS_COLORS[row.status]}>{row.status}</Tag>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-neutral-400">{dayjs(row.orderDate).format("MMM D, YYYY")}</span>
                  <span className="font-medium">{formatCurrency(row.totalAmount)}</span>
                </div>
              </Card>
            )}
          />
        </div>
      </Card>
    </div>
  );
}
