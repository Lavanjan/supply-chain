"use client";

import { useMemo, useState } from "react";
import { Card, Col, Row, Select, Switch, Tag, Typography, type TableColumnsType } from "antd";
import {
  AppstoreOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { CategoryValueChart } from "@/features/reports/components/charts/category-value-chart";
import { ReportTable } from "@/features/reports/components/report-table";
import { ReportToolbar } from "@/features/reports/components/report-toolbar";
import { useReportData } from "@/features/reports/hooks/use-report-data";
import { useReportFilterOptions } from "@/features/reports/hooks/use-report-filter-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { CategoryValuePoint, InventoryReportRow, InventoryReportSummary } from "@/types/report.types";

const STOCK_STATUS_COLOR: Record<string, string> = {
  NORMAL: "green",
  LOW_STOCK: "gold",
  OUT_OF_STOCK: "red",
};

const STOCK_STATUS_LABEL: Record<string, string> = {
  NORMAL: "Normal",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};

export function InventoryReport() {
  const { categories, warehouses, loading: optionsLoading } = useReportFilterOptions();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      categoryId,
      warehouseId,
      lowStockOnly: lowStockOnly ? "true" : undefined,
    }),
    [search, categoryId, warehouseId, lowStockOnly],
  );

  const { result, page, setPage, loading } = useReportData<InventoryReportRow, InventoryReportSummary, CategoryValuePoint>({
    endpoint: "/api/reports/inventory",
    filters,
  });

  function handleExport() {
    if (!result) return;
    const csv = toCsv(result.data, [
      { key: "productName", label: "Product", value: (row) => row.productName },
      { key: "sku", label: "SKU", value: (row) => row.sku },
      { key: "categoryName", label: "Category", value: (row) => row.categoryName },
      { key: "quantity", label: "Quantity", value: (row) => row.quantity },
      { key: "unitSymbol", label: "Unit", value: (row) => row.unitSymbol },
      { key: "unitCost", label: "Unit Cost", value: (row) => row.unitCost },
      { key: "totalValue", label: "Total Value", value: (row) => row.totalValue },
      { key: "stockStatus", label: "Status", value: (row) => STOCK_STATUS_LABEL[row.stockStatus] },
    ]);
    downloadCsv(`inventory-report-${Date.now()}.csv`, csv);
  }

  const columns: TableColumnsType<InventoryReportRow> = [
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
    { title: "Category", dataIndex: "categoryName" },
    {
      title: "Quantity",
      key: "quantity",
      align: "right",
      render: (_, row) => `${formatNumber(row.quantity)} ${row.unitSymbol}`,
    },
    { title: "Unit Cost", dataIndex: "unitCost", align: "right", render: (value: number) => formatCurrency(value) },
    { title: "Total Value", dataIndex: "totalValue", align: "right", render: (value: number) => formatCurrency(value) },
    {
      title: "Status",
      dataIndex: "stockStatus",
      render: (value: string) => <Tag color={STOCK_STATUS_COLOR[value]}>{STOCK_STATUS_LABEL[value]}</Tag>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}>
          <StatCard icon={<AppstoreOutlined />} label="Total SKUs" value={formatNumber(result?.summary.totalSkus ?? 0)} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<DollarOutlined />}
            label="Total Stock Value"
            value={formatCurrency(result?.summary.totalStockValue ?? 0)}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<WarningOutlined />}
            label="Low Stock"
            value={formatNumber(result?.summary.lowStockCount ?? 0)}
            tone="warning"
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            icon={<ExclamationCircleOutlined />}
            label="Out of Stock"
            value={formatNumber(result?.summary.outOfStockCount ?? 0)}
            tone="critical"
          />
        </Col>
      </Row>

      <Card title="Stock Value by Category" className="rounded-2xl">
        <CategoryValueChart data={result?.chart ?? []} />
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
                  placeholder="Category"
                  className="w-full sm:w-44"
                  loading={optionsLoading}
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
                <Select
                  allowClear
                  placeholder="Warehouse"
                  className="w-full sm:w-44"
                  loading={optionsLoading}
                  value={warehouseId}
                  onChange={setWarehouseId}
                  options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                />
                <div className="flex items-center gap-2">
                  <Switch checked={lowStockOnly} onChange={setLowStockOnly} size="small" />
                  <Typography.Text className="text-sm">Low stock only</Typography.Text>
                </div>
              </>
            }
          />

          <ReportTable<InventoryReportRow>
            columns={columns}
            dataSource={result?.data ?? []}
            rowKey="productId"
            loading={loading}
            total={result?.total ?? 0}
            page={page}
            pageSize={result?.pageSize ?? 10}
            onPageChange={setPage}
            emptyText="No inventory records found"
            renderMobileCard={(row) => (
              <Card size="small" className="rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Typography.Text strong className="block">
                      {row.productName}
                    </Typography.Text>
                    <span className="text-xs text-neutral-500">
                      {row.sku} &middot; {row.categoryName}
                    </span>
                  </div>
                  <Tag color={STOCK_STATUS_COLOR[row.stockStatus]}>{STOCK_STATUS_LABEL[row.stockStatus]}</Tag>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-neutral-400">
                    {formatNumber(row.quantity)} {row.unitSymbol}
                  </span>
                  <span className="font-medium">{formatCurrency(row.totalValue)}</span>
                </div>
              </Card>
            )}
          />
        </div>
      </Card>
    </div>
  );
}
