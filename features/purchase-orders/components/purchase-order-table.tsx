"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Select, Tag, Typography, type TableColumnsType } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { formatCurrency } from "@/lib/utils/format";
import type { PurchaseOrderListItem } from "@/types/purchase-order.types";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

export function PurchaseOrderTable() {
  const { can } = usePermission();
  const [status, setStatus] = useState<string | undefined>();
  const table = useDataTable<PurchaseOrderListItem>({
    endpoint: "/api/purchase-orders",
    extraParams: { status },
  });

  const columns: TableColumnsType<PurchaseOrderListItem> = [
    { title: "PO Number", dataIndex: "poNumber", sorter: true },
    { title: "Supplier", dataIndex: "supplierName" },
    { title: "Warehouse", dataIndex: "warehouseName" },
    {
      title: "Order Date",
      dataIndex: "orderDate",
      sorter: true,
      render: (value: string) => dayjs(value).format("MMM D, YYYY"),
    },
    { title: "Items", dataIndex: "itemCount", align: "right" },
    {
      title: "Total",
      dataIndex: "totalAmount",
      align: "right",
      sorter: true,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: true,
      render: (value: string) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Link href={`/dashboard/purchase-orders/${record.id}`}>
          <Button type="text" icon={<EyeOutlined />} />
        </Link>
      ),
    },
  ];

  return (
    <DataTable<PurchaseOrderListItem>
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
      searchPlaceholder="Search PO number or supplier..."
      onSortChange={table.setSort}
      emptyText="No purchase orders yet"
      filters={
        <Select
          allowClear
          placeholder="Status"
          className="w-40"
          value={status}
          onChange={setStatus}
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "APPROVED", label: "Approved" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
      }
      toolbarExtra={
        can("purchase-orders.create") && (
          <Link href="/dashboard/purchase-orders/new">
            <Button type="primary" icon={<PlusOutlined />}>
              New Purchase Order
            </Button>
          </Link>
        )
      }
      renderMobileCard={(po) => (
        <Link href={`/dashboard/purchase-orders/${po.id}`}>
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {po.poNumber}
                </Typography.Text>
                <span className="text-xs text-neutral-500">{po.supplierName}</span>
              </div>
              <Tag color={STATUS_COLORS[po.status]}>{po.status}</Tag>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-neutral-400">{dayjs(po.orderDate).format("MMM D, YYYY")}</span>
              <span className="font-medium">{formatCurrency(po.totalAmount)}</span>
            </div>
          </Card>
        </Link>
      )}
    />
  );
}
