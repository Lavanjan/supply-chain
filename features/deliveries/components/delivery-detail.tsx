"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Button, Card, Descriptions, Skeleton, Table, Tag, Typography } from "antd";
import { CarOutlined, CloseOutlined, DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { apiClient, ApiError } from "@/lib/api/client";
import { usePermission } from "@/hooks/use-permission";
import type { DeliveryDetail as DeliveryDetailType } from "@/types/delivery.types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "gold",
  DELIVERED: "green",
  CANCELLED: "red",
};

export function DeliveryDetail({ id }: { id: string }) {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [delivery, setDelivery] = useState<DeliveryDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiClient
      .get<DeliveryDetailType>(`/api/deliveries/${id}`)
      .then(setDelivery)
      .catch(() => setDelivery(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkDelivered() {
    modal.confirm({
      title: "Mark this delivery as delivered?",
      content: "This will deduct the delivered quantities from warehouse stock (FIFO/FEFO by batch). This action cannot be undone.",
      okText: "Mark Delivered",
      onOk: async () => {
        try {
          await apiClient.post(`/api/deliveries/${id}/deliver`, {});
          message.success("Delivery marked as delivered");
          load();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to mark as delivered");
        }
      },
    });
  }

  async function handleCancel() {
    modal.confirm({
      title: "Cancel this delivery?",
      content: "This action cannot be undone.",
      okText: "Cancel Delivery",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.post(`/api/deliveries/${id}/cancel`, {});
          message.success("Delivery cancelled");
          load();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to cancel");
        }
      },
    });
  }

  async function handleDelete() {
    modal.confirm({
      title: "Delete this delivery?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/deliveries/${id}`);
          message.success("Delivery deleted");
          router.push("/dashboard/deliveries");
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete");
        }
      },
    });
  }

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (!delivery) {
    return (
      <Card className="rounded-2xl">
        <Typography.Text type="danger">Delivery not found.</Typography.Text>
      </Card>
    );
  }

  const isPending = delivery.status === "PENDING";

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Typography.Title level={3} className="!mb-1">
              {delivery.deliveryNumber}
            </Typography.Title>
            <Tag color={STATUS_COLORS[delivery.status]}>{delivery.status}</Tag>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/deliveries/${id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Button icon={<DownloadOutlined />}>Print Delivery Note</Button>
            </a>
            {isPending && can("deliveries.update") && (
              <Link href={`/dashboard/deliveries/${id}/edit`}>
                <Button icon={<EditOutlined />}>Edit</Button>
              </Link>
            )}
            {isPending && can("deliveries.update") && (
              <Button type="primary" icon={<CarOutlined />} onClick={handleMarkDelivered}>
                Mark Delivered
              </Button>
            )}
            {isPending && can("deliveries.cancel") && (
              <Button danger icon={<CloseOutlined />} onClick={handleCancel}>
                Cancel Delivery
              </Button>
            )}
            {isPending && can("deliveries.delete") && (
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>

        <Descriptions column={{ xs: 1, sm: 2 }} className="mt-4" size="small">
          <Descriptions.Item label="Customer">{delivery.customerName}</Descriptions.Item>
          <Descriptions.Item label="Warehouse">{delivery.warehouseName}</Descriptions.Item>
          <Descriptions.Item label="Vehicle">{delivery.vehiclePlateNumber || "—"}</Descriptions.Item>
          <Descriptions.Item label="Driver">{delivery.driverName || "—"}</Descriptions.Item>
          <Descriptions.Item label="Scheduled Date">{dayjs(delivery.scheduledDate).format("MMM D, YYYY")}</Descriptions.Item>
          <Descriptions.Item label="Delivered Date">
            {delivery.deliveredDate ? dayjs(delivery.deliveredDate).format("MMM D, YYYY") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">{delivery.createdByName}</Descriptions.Item>
          {delivery.deliveryAddress && (
            <Descriptions.Item label="Delivery Address" span={2}>
              {delivery.deliveryAddress}
            </Descriptions.Item>
          )}
          {delivery.notes && (
            <Descriptions.Item label="Notes" span={2}>
              {delivery.notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="Items" className="rounded-2xl">
        <div className="overflow-x-auto">
          <Table
            dataSource={delivery.items}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              {
                title: "Product",
                key: "product",
                render: (_, item) => (
                  <div>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-neutral-400">{item.sku}</div>
                  </div>
                ),
              },
              {
                title: "Quantity",
                key: "quantity",
                align: "right",
                render: (_, item) => `${item.quantity} ${item.unitSymbol}`,
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
