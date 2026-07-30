"use client";

import { useMemo, useState } from "react";
import { Card, Col, DatePicker, Row, Select, Tag, Typography, type TableColumnsType } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, SwapOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { StockMovementChart } from "@/features/reports/components/charts/stock-movement-chart";
import { ReportTable } from "@/features/reports/components/report-table";
import { ReportToolbar } from "@/features/reports/components/report-toolbar";
import { useReportData } from "@/features/reports/hooks/use-report-data";
import { useReportFilterOptions } from "@/features/reports/hooks/use-report-filter-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { formatNumber } from "@/lib/utils/format";
import type { StockMovementPoint, StockMovementReportRow, StockMovementSummary } from "@/types/report.types";

const { RangePicker } = DatePicker;

const TYPE_COLORS: Record<string, string> = {
  STOCK_IN: "green",
  STOCK_OUT: "red",
  ADJUSTMENT: "blue",
  TRANSFER_IN: "cyan",
  TRANSFER_OUT: "orange",
};

const TYPE_LABELS: Record<string, string> = {
  STOCK_IN: "Stock In",
  STOCK_OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
};

export function StockMovementReport() {
  const { warehouses, products, loading: optionsLoading } = useReportFilterOptions();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [productId, setProductId] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();

  const filters = useMemo(
    () => ({ search: search || undefined, warehouseId, productId, type, dateFrom, dateTo }),
    [search, warehouseId, productId, type, dateFrom, dateTo],
  );

  const { result, page, setPage, loading } = useReportData<StockMovementReportRow, StockMovementSummary, StockMovementPoint>({
    endpoint: "/api/reports/stock-movement",
    filters,
  });

  function handleExport() {
    if (!result) return;
    const csv = toCsv(result.data, [
      { key: "date", label: "Date", value: (row) => dayjs(row.date).format("YYYY-MM-DD HH:mm") },
      { key: "productName", label: "Product", value: (row) => row.productName },
      { key: "sku", label: "SKU", value: (row) => row.sku },
      { key: "warehouseName", label: "Warehouse", value: (row) => row.warehouseName },
      { key: "type", label: "Type", value: (row) => TYPE_LABELS[row.type] ?? row.type },
      { key: "quantity", label: "Quantity", value: (row) => row.quantity },
      { key: "previousQuantity", label: "Previous Qty", value: (row) => row.previousQuantity },
      { key: "newQuantity", label: "New Qty", value: (row) => row.newQuantity },
      { key: "performedByName", label: "Performed By", value: (row) => row.performedByName },
    ]);
    downloadCsv(`stock-movement-report-${Date.now()}.csv`, csv);
  }

  const columns: TableColumnsType<StockMovementReportRow> = [
    { title: "Date", dataIndex: "date", render: (value: string) => dayjs(value).format("MMM D, YYYY h:mm A") },
    {
      title: "Product",
      key: "product",
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.productName}</div>
          <div className="text-xs text-neutral-400">{row.sku}</div>
        </div>
      ),
    },
    { title: "Warehouse", dataIndex: "warehouseName" },
    { title: "Type", dataIndex: "type", render: (value: string) => <Tag color={TYPE_COLORS[value]}>{TYPE_LABELS[value]}</Tag> },
    { title: "Quantity", dataIndex: "quantity", align: "right", render: (value: number) => formatNumber(value) },
    { title: "Performed By", dataIndex: "performedByName" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={8}>
          <StatCard icon={<ArrowUpOutlined />} label="Total Stock In" value={formatNumber(result?.summary.totalStockIn ?? 0)} />
        </Col>
        <Col xs={12} lg={8}>
          <StatCard
            icon={<ArrowDownOutlined />}
            label="Total Stock Out"
            value={formatNumber(result?.summary.totalStockOut ?? 0)}
          />
        </Col>
        <Col xs={24} lg={8}>
          <StatCard icon={<SwapOutlined />} label="Net Change" value={formatNumber(result?.summary.netChange ?? 0)} />
        </Col>
      </Row>

      <Card title="Stock In vs Stock Out" className="rounded-2xl">
        <StockMovementChart data={result?.chart ?? []} />
      </Card>

      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3">
          <ReportToolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search product or SKU..."
            onExport={handleExport}
            exportDisabled={!result || result.data.length === 0}
            filters={
              <>
                <Select
                  allowClear
                  placeholder="Warehouse"
                  className="w-full sm:w-44"
                  loading={optionsLoading}
                  value={warehouseId}
                  onChange={setWarehouseId}
                  options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                />
                <Select
                  allowClear
                  showSearch
                  placeholder="Product"
                  className="w-full sm:w-44"
                  loading={optionsLoading}
                  optionFilterProp="label"
                  value={productId}
                  onChange={setProductId}
                  options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                />
                <Select
                  allowClear
                  placeholder="Type"
                  className="w-full sm:w-40"
                  value={type}
                  onChange={setType}
                  options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
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

          <ReportTable<StockMovementReportRow>
            columns={columns}
            dataSource={result?.data ?? []}
            rowKey="id"
            loading={loading}
            total={result?.total ?? 0}
            page={page}
            pageSize={result?.pageSize ?? 10}
            onPageChange={setPage}
            emptyText="No stock movement found"
            renderMobileCard={(row) => (
              <Card size="small" className="rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Typography.Text strong className="block">
                      {row.productName}
                    </Typography.Text>
                    <span className="text-xs text-neutral-500">{row.warehouseName}</span>
                  </div>
                  <Tag color={TYPE_COLORS[row.type]}>{TYPE_LABELS[row.type]}</Tag>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-neutral-400">{dayjs(row.date).format("MMM D, YYYY h:mm A")}</span>
                  <span className="font-medium">{formatNumber(row.quantity)}</span>
                </div>
              </Card>
            )}
          />
        </div>
      </Card>
    </div>
  );
}
