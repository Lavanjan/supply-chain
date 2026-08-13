"use client";

import { useMemo, useState } from "react";
import { Card, Col, DatePicker, Row, Select, Tag, Typography, type TableColumnsType } from "antd";
import { CarOutlined, CheckCircleOutlined, DollarOutlined, RiseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { MonthlyRevenueChart } from "@/features/reports/components/charts/monthly-revenue-chart";
import { ReportTable } from "@/features/reports/components/report-table";
import { ReportToolbar } from "@/features/reports/components/report-toolbar";
import { useReportData } from "@/features/reports/hooks/use-report-data";
import { useReportFilterOptions } from "@/features/reports/hooks/use-report-filter-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { MonthlyRevenuePoint, SalesReportRow, SalesReportSummary } from "@/types/report.types";

const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "gold",
  DELIVERED: "green",
  CANCELLED: "red",
};

export function SalesReport() {
  const { customers, loading: optionsLoading } = useReportFilterOptions();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();

  const filters = useMemo(
    () => ({ search: search || undefined, customerId, status, dateFrom, dateTo }),
    [search, customerId, status, dateFrom, dateTo],
  );

  const { result, page, setPage, loading } = useReportData<SalesReportRow, SalesReportSummary, MonthlyRevenuePoint>({
    endpoint: "/api/reports/sales",
    filters,
  });

  function handleExport() {
    if (!result) return;
    const csv = toCsv(result.data, [
      { key: "deliveryNumber", label: "Delivery Number", value: (row) => row.deliveryNumber },
      { key: "customerName", label: "Customer", value: (row) => row.customerName },
      { key: "scheduledDate", label: "Scheduled Date", value: (row) => dayjs(row.scheduledDate).format("YYYY-MM-DD") },
      { key: "status", label: "Status", value: (row) => row.status },
      { key: "itemCount", label: "Items", value: (row) => row.itemCount },
      { key: "totalAmount", label: "Total Amount", value: (row) => row.totalAmount },
    ]);
    downloadCsv(`sales-report-${Date.now()}.csv`, csv);
  }

  const columns: TableColumnsType<SalesReportRow> = [
    { title: "Delivery No.", dataIndex: "deliveryNumber" },
    { title: "Customer", dataIndex: "customerName" },
    { title: "Scheduled Date", dataIndex: "scheduledDate", render: (value: string) => dayjs(value).format("MMM D, YYYY") },
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
          <StatCard icon={<CarOutlined />} label="Total Deliveries" value={formatNumber(result?.summary.totalDeliveries ?? 0)} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard icon={<DollarOutlined />} label="Total Revenue" value={formatCurrency(result?.summary.totalRevenue ?? 0)} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<RiseOutlined />}
            label="Avg. Delivery Value"
            value={formatCurrency(result?.summary.averageDeliveryValue ?? 0)}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label="Delivered"
            value={formatNumber(result?.summary.deliveredCount ?? 0)}
          />
        </Col>
      </Row>

      <Card title="Revenue Over Time" className="rounded-2xl">
        <MonthlyRevenueChart data={result?.chart ?? []} />
      </Card>

      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3">
          <ReportToolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search delivery number or customer..."
            onExport={handleExport}
            exportDisabled={!result || result.data.length === 0}
            filters={
              <>
                <Select
                  allowClear
                  placeholder="Customer"
                  className="w-full sm:w-44"
                  loading={optionsLoading}
                  value={customerId}
                  onChange={setCustomerId}
                  options={customers.map((c) => ({ value: c.id, label: c.companyName }))}
                />
                <Select
                  allowClear
                  placeholder="Status"
                  className="w-full sm:w-40"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "PENDING", label: "Pending" },
                    { value: "DELIVERED", label: "Delivered" },
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

          <ReportTable<SalesReportRow>
            columns={columns}
            dataSource={result?.data ?? []}
            rowKey="id"
            loading={loading}
            total={result?.total ?? 0}
            page={page}
            pageSize={result?.pageSize ?? 10}
            onPageChange={setPage}
            emptyText="No deliveries found"
            renderMobileCard={(row) => (
              <Card size="small" className="rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Typography.Text strong className="block">
                      {row.deliveryNumber}
                    </Typography.Text>
                    <span className="text-xs text-neutral-500">{row.customerName}</span>
                  </div>
                  <Tag color={STATUS_COLORS[row.status]}>{row.status}</Tag>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-neutral-400">{dayjs(row.scheduledDate).format("MMM D, YYYY")}</span>
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
