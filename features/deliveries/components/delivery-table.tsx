"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Select, Tag, Typography, type TableColumnsType } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import type { DeliveryListItem } from "@/types/delivery.types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "gold",
  DELIVERED: "green",
  CANCELLED: "red",
};

export function DeliveryTable() {
  const { can } = usePermission();
  const [status, setStatus] = useState<string | undefined>();
  const table = useDataTable<DeliveryListItem>({
    endpoint: "/api/deliveries",
    extraParams: { status },
  });

  const columns: TableColumnsType<DeliveryListItem> = [
    { title: "Delivery No.", dataIndex: "deliveryNumber", sorter: true },
    { title: "Customer", dataIndex: "customerName" },
    { title: "Warehouse", dataIndex: "warehouseName" },
    {
      title: "Vehicle / Driver",
      key: "vehicleDriver",
      render: (_, record) => (
        <span>
          {record.vehiclePlateNumber || "—"} · {record.driverName || "—"}
        </span>
      ),
    },
    {
      title: "Scheduled Date",
      dataIndex: "scheduledDate",
      sorter: true,
      render: (value: string) => dayjs(value).format("MMM D, YYYY"),
    },
    { title: "Items", dataIndex: "itemCount", align: "right" },
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
        <Link href={`/dashboard/deliveries/${record.id}`}>
          <Button type="text" icon={<EyeOutlined />} />
        </Link>
      ),
    },
  ];

  return (
    <DataTable<DeliveryListItem>
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
      searchPlaceholder="Search delivery number or customer..."
      onSortChange={table.setSort}
      emptyText="No deliveries yet"
      filters={
        <Select
          allowClear
          placeholder="Status"
          className="w-40"
          value={status}
          onChange={setStatus}
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "DELIVERED", label: "Delivered" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
      }
      toolbarExtra={
        can("deliveries.create") && (
          <Link href="/dashboard/deliveries/new">
            <Button type="primary" icon={<PlusOutlined />}>
              New Delivery
            </Button>
          </Link>
        )
      }
      renderMobileCard={(delivery) => (
        <Link href={`/dashboard/deliveries/${delivery.id}`}>
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {delivery.deliveryNumber}
                </Typography.Text>
                <span className="text-xs text-neutral-500">{delivery.customerName}</span>
              </div>
              <Tag color={STATUS_COLORS[delivery.status]}>{delivery.status}</Tag>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-neutral-400">{dayjs(delivery.scheduledDate).format("MMM D, YYYY")}</span>
              <span className="font-medium">{delivery.itemCount} items</span>
            </div>
          </Card>
        </Link>
      )}
    />
  );
}
