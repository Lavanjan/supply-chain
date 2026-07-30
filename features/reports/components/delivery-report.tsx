"use client";

import { useMemo, useState } from "react";
import { Card, Col, DatePicker, Row, Select, Tag, Typography, type TableColumnsType } from "antd";
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { DeliveryStatusChart } from "@/features/reports/components/charts/delivery-status-chart";
import { ReportTable } from "@/features/reports/components/report-table";
import { ReportToolbar } from "@/features/reports/components/report-toolbar";
import { useReportData } from "@/features/reports/hooks/use-report-data";
import { useReportFilterOptions } from "@/features/reports/hooks/use-report-filter-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { formatNumber } from "@/lib/utils/format";
import type { DeliveryReportRow, DeliveryReportSummary, DeliveryStatusPoint } from "@/types/report.types";

const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "gold",
  DELIVERED: "green",
  CANCELLED: "red",
};

export function DeliveryReport() {
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

  const { result, page, setPage, loading } = useReportData<DeliveryReportRow, DeliveryReportSummary, DeliveryStatusPoint>({
    endpoint: "/api/reports/deliveries",
    filters,
  });

  function handleExport() {
    if (!result) return;
    const csv = toCsv(result.data, [
      { key: "deliveryNumber", label: "Delivery Number", value: (row) => row.deliveryNumber },
      { key: "customerName", label: "Customer", value: (row) => row.customerName },
      { key: "warehouseName", label: "Warehouse", value: (row) => row.warehouseName },
      { key: "scheduledDate", label: "Scheduled Date", value: (row) => dayjs(row.scheduledDate).format("YYYY-MM-DD") },
      {
        key: "deliveredDate",
        label: "Delivered Date",
        value: (row) => (row.deliveredDate ? dayjs(row.deliveredDate).format("YYYY-MM-DD") : ""),
      },
      { key: "status", label: "Status", value: (row) => row.status },
      { key: "itemCount", label: "Items", value: (row) => row.itemCount },
    ]);
    downloadCsv(`delivery-report-${Date.now()}.csv`, csv);
  }

  const columns: TableColumnsType<DeliveryReportRow> = [
    { title: "Delivery No.", dataIndex: "deliveryNumber" },
    { title: "Customer", dataIndex: "customerName" },
    { title: "Warehouse", dataIndex: "warehouseName" },
    { title: "Scheduled", dataIndex: "scheduledDate", render: (value: string) => dayjs(value).format("MMM D, YYYY") },
    { title: "Items", dataIndex: "itemCount", align: "right" },
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
          <StatCard
            icon={<CheckCircleOutlined />}
            label="Delivered"
            value={formatNumber(result?.summary.deliveredCount ?? 0)}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<ClockCircleOutlined />}
            label="Pending"
            value={formatNumber(result?.summary.pendingCount ?? 0)}
            tone="warning"
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<CloseCircleOutlined />}
            label="Cancelled"
            value={formatNumber(result?.summary.cancelledCount ?? 0)}
            tone="critical"
          />
        </Col>
      </Row>

      <Card title="Deliveries by Status" className="rounded-2xl">
        <DeliveryStatusChart data={result?.chart ?? []} />
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

          <ReportTable<DeliveryReportRow>
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
                  <span className="font-medium">{row.itemCount} items</span>
                </div>
              </Card>
            )}
          />
        </div>
      </Card>
    </div>
  );
}
