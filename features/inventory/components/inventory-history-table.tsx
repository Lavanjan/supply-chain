"use client";

import { Card, DatePicker, Select, Tag, Typography, type TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/ui/data-table";
import { useInventoryOptions } from "@/features/inventory/hooks/use-inventory-options";
import type { InventoryHistoryItem } from "@/types/inventory.types";

const { RangePicker } = DatePicker;

const TYPE_COLORS: Record<string, string> = {
  STOCK_IN: "green",
  STOCK_OUT: "red",
  ADJUSTMENT: "gold",
  TRANSFER_IN: "cyan",
  TRANSFER_OUT: "purple",
};

const TYPE_LABELS: Record<string, string> = {
  STOCK_IN: "Stock In",
  STOCK_OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

interface InventoryHistoryTableProps {
  warehouseId?: string;
  onWarehouseChange: (value?: string) => void;
  type?: string;
  onTypeChange: (value?: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateRangeChange: (from?: string, to?: string) => void;
}

export function InventoryHistoryTable({
  warehouseId,
  onWarehouseChange,
  type,
  onTypeChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
}: InventoryHistoryTableProps) {
  const { warehouses } = useInventoryOptions();
  const table = useDataTable<InventoryHistoryItem>({
    endpoint: "/api/inventory/history",
    extraParams: { warehouseId, type, dateFrom, dateTo },
  });

  const columns: TableColumnsType<InventoryHistoryItem> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      render: (value: string) => dayjs(value).format("MMM D, YYYY h:mm A"),
    },
    {
      title: "Product",
      dataIndex: "productName",
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.productName}</div>
          <div className="text-xs text-neutral-400">{record.sku}</div>
        </div>
      ),
    },
    { title: "Warehouse", dataIndex: "warehouseName" },
    {
      title: "Type",
      dataIndex: "type",
      render: (value: string) => <Tag color={TYPE_COLORS[value]}>{TYPE_LABELS[value]}</Tag>,
    },
    {
      title: "Change",
      key: "change",
      align: "right",
      render: (_, record) => {
        const delta = record.newQuantity - record.previousQuantity;
        return (
          <span className={delta >= 0 ? "text-green-600" : "text-red-600"}>
            {delta >= 0 ? "+" : ""}
            {delta} <span className="text-neutral-400">({record.previousQuantity} → {record.newQuantity})</span>
          </span>
        );
      },
    },
    {
      title: "Batch",
      dataIndex: "batchNumber",
      render: (value: string | null) => value || <span className="text-neutral-400">—</span>,
    },
    {
      title: "By",
      dataIndex: "performedByName",
    },
  ];

  return (
    <DataTable<InventoryHistoryItem>
      columns={columns}
      dataSource={table.data}
      rowKey="id"
      loading={table.loading}
      total={table.total}
      page={table.page}
      pageSize={table.pageSize}
      onPageChange={table.setPage}
      searchValue={table.searchInput}
      onSearchChange={table.setSearchInput}
      searchPlaceholder="Search history..."
      onSortChange={table.setSort}
      emptyText="No inventory movements yet"
      filters={
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            allowClear
            placeholder="Warehouse"
            className="w-40"
            value={warehouseId}
            onChange={onWarehouseChange}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />
          <Select
            allowClear
            placeholder="Type"
            className="w-40"
            value={type}
            onChange={onTypeChange}
            options={TYPE_OPTIONS}
          />
          <RangePicker
            value={dateFrom && dateTo ? [dayjs(dateFrom), dayjs(dateTo)] : null}
            onChange={(dates) => {
              if (!dates || !dates[0] || !dates[1]) {
                onDateRangeChange(undefined, undefined);
                return;
              }
              onDateRangeChange(dates[0].startOf("day").toISOString(), dates[1].endOf("day").toISOString());
            }}
          />
        </div>
      }
      renderMobileCard={(item) => (
        <Card size="small" className="rounded-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Typography.Text strong className="block">
                {item.productName}
              </Typography.Text>
              <span className="text-xs text-neutral-400">{item.warehouseName}</span>
            </div>
            <Tag color={TYPE_COLORS[item.type]}>{TYPE_LABELS[item.type]}</Tag>
          </div>
          <div className="text-sm mt-2">
            {item.previousQuantity} → {item.newQuantity}
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            {dayjs(item.createdAt).format("MMM D, YYYY h:mm A")} · {item.performedByName}
          </div>
        </Card>
      )}
    />
  );
}
