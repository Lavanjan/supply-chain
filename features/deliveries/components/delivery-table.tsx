"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Select, Tag, Typography, type TableColumnsType } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { DeliveryFormModal } from "@/features/deliveries/components/delivery-form-modal";
import { DeliveryDetailModal } from "@/features/deliveries/components/delivery-detail-modal";
import type { DeliveryListItem } from "@/types/delivery.types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "gold",
  DELIVERED: "green",
  CANCELLED: "red",
};

export function DeliveryTable() {
  const { can } = usePermission();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const table = useDataTable<DeliveryListItem>({
    endpoint: "/api/deliveries",
    extraParams: { status },
  });

  useEffect(() => {
    const view = searchParams.get("view");
    if (view) {
      setViewingId(view);
      router.replace("/dashboard/deliveries");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Button type="text" icon={<EyeOutlined />} onClick={() => setViewingId(record.id)} />
      ),
    },
  ];

  return (
    <>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              New Delivery
            </Button>
          )
        }
        renderMobileCard={(delivery) => (
          <Card size="small" className="rounded-xl cursor-pointer" onClick={() => setViewingId(delivery.id)}>
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
        )}
      />

      <DeliveryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={table.reload}
        onCreated={(id) => {
          setModalOpen(false);
          setViewingId(id);
        }}
      />

      <DeliveryDetailModal
        open={viewingId !== null}
        id={viewingId}
        onClose={() => setViewingId(null)}
        onChanged={table.reload}
      />
    </>
  );
}
