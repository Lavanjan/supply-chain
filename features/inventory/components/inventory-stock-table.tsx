"use client";

import { Card, Checkbox, Select, Tag, Typography, type TableColumnsType } from "antd";
import dayjs from "dayjs";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/ui/data-table";
import { useInventoryOptions } from "@/features/inventory/hooks/use-inventory-options";
import type { InventoryStockItem } from "@/types/inventory.types";

const EXPIRY_WARNING_DAYS = 30;

function expiryTag(expiryDate: string | null) {
  if (!expiryDate) return null;
  const days = dayjs(expiryDate).diff(dayjs(), "day");
  if (days < 0) return <Tag color="red">Expired</Tag>;
  if (days <= EXPIRY_WARNING_DAYS) return <Tag color="gold">Expiring soon</Tag>;
  return null;
}

export function InventoryStockTable({
  warehouseId,
  onWarehouseChange,
  lowStockOnly,
  onLowStockOnlyChange,
}: {
  warehouseId?: string;
  onWarehouseChange: (value?: string) => void;
  lowStockOnly: boolean;
  onLowStockOnlyChange: (value: boolean) => void;
}) {
  const { warehouses } = useInventoryOptions();
  const table = useDataTable<InventoryStockItem>({
    endpoint: "/api/inventory",
    extraParams: { warehouseId, lowStockOnly: lowStockOnly ? "true" : undefined },
  });

  const columns: TableColumnsType<InventoryStockItem> = [
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
      title: "Batch",
      dataIndex: "batchNumber",
      render: (value: string | null) => value || <span className="text-neutral-400">—</span>,
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      sorter: true,
      render: (value: string | null) =>
        value ? (
          <span className="flex items-center gap-2">
            {dayjs(value).format("MMM D, YYYY")}
            {expiryTag(value)}
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      align: "right",
      sorter: true,
      render: (value: number, record) => (
        <span className="flex items-center gap-2 justify-end">
          {value} {record.unitSymbol}
          {value <= 0 ? (
            <Tag color="red">Out of stock</Tag>
          ) : value <= record.minimumStock ? (
            <Tag color="gold">Low stock</Tag>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <DataTable<InventoryStockItem>
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
      searchPlaceholder="Search product, SKU, or batch..."
      onSortChange={table.setSort}
      emptyText="No inventory records yet"
      filters={
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            allowClear
            placeholder="Warehouse"
            className="w-44"
            value={warehouseId}
            onChange={onWarehouseChange}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />
          <Checkbox checked={lowStockOnly} onChange={(e) => onLowStockOnlyChange(e.target.checked)}>
            Low stock only
          </Checkbox>
        </div>
      }
      renderMobileCard={(item) => (
        <Card size="small" className="rounded-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Typography.Text strong className="block">
                {item.productName}
              </Typography.Text>
              <span className="text-xs text-neutral-400">
                {item.sku} · {item.warehouseName}
              </span>
            </div>
            <span className="text-sm font-medium">
              {item.quantity} {item.unitSymbol}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.batchNumber && <Tag>{item.batchNumber}</Tag>}
            {item.expiryDate && (
              <span className="text-xs text-neutral-400">{dayjs(item.expiryDate).format("MMM D, YYYY")}</span>
            )}
            {expiryTag(item.expiryDate)}
            {item.quantity <= 0 ? (
              <Tag color="red">Out of stock</Tag>
            ) : item.quantity <= item.minimumStock ? (
              <Tag color="gold">Low stock</Tag>
            ) : null}
          </div>
        </Card>
      )}
    />
  );
}
