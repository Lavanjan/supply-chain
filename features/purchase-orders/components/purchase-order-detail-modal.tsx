"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Button, Card, Descriptions, Modal, Skeleton, Table, Tag, Typography } from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/format";
import { usePermission } from "@/hooks/use-permission";
import { PurchaseOrderFormModal } from "@/features/purchase-orders/components/purchase-order-form-modal";
import type { PurchaseOrderDetail as PurchaseOrderDetailType } from "@/types/purchase-order.types";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

interface PurchaseOrderDetailModalProps {
  open: boolean;
  id: string | null;
  onClose: () => void;
  onChanged?: () => void;
}

export function PurchaseOrderDetailModal({ open, id, onClose, onChanged }: PurchaseOrderDetailModalProps) {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const [po, setPo] = useState<PurchaseOrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get<PurchaseOrderDetailType>(`/api/purchase-orders/${id}`)
      .then(setPo)
      .catch(() => setPo(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (open && id) {
      load();
    }
  }, [open, id, load]);

  async function handleApprove() {
    modal.confirm({
      title: "Approve this purchase order?",
      content: "Once approved, line items can no longer be edited.",
      okText: "Approve",
      onOk: async () => {
        try {
          await apiClient.post(`/api/purchase-orders/${id}/approve`, {});
          message.success("Purchase order approved");
          load();
          onChanged?.();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to approve");
        }
      },
    });
  }

  async function handleCancel() {
    modal.confirm({
      title: "Cancel this purchase order?",
      content: "This action cannot be undone.",
      okText: "Cancel Order",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.post(`/api/purchase-orders/${id}/cancel`, {});
          message.success("Purchase order cancelled");
          load();
          onChanged?.();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to cancel");
        }
      },
    });
  }

  async function handleDelete() {
    modal.confirm({
      title: "Delete this purchase order?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/purchase-orders/${id}`);
          message.success("Purchase order deleted");
          onClose();
          onChanged?.();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete");
        }
      },
    });
  }

  const isDraft = po?.status === "DRAFT";
  const canCancel = po?.status === "DRAFT" || po?.status === "APPROVED";

  return (
    <Modal
      title={po?.poNumber ?? "Purchase Order"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      destroyOnHidden
    >
      {loading && <Skeleton active paragraph={{ rows: 8 }} />}

      {!loading && !po && <Typography.Text type="danger">Purchase order not found.</Typography.Text>}

      {!loading && po && (
        <div className="flex flex-col gap-4">
          <Card className="rounded-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Tag color={STATUS_COLORS[po.status]}>{po.status}</Tag>
              <div className="flex flex-wrap gap-2">
                <a href={`/api/purchase-orders/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                  <Button icon={<DownloadOutlined />}>Print PDF</Button>
                </a>
                {isDraft && can("purchase-orders.update") && (
                  <Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>
                    Edit
                  </Button>
                )}
                {isDraft && can("purchase-orders.approve") && (
                  <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
                    Approve
                  </Button>
                )}
                {canCancel && can("purchase-orders.cancel") && (
                  <Button danger icon={<CloseOutlined />} onClick={handleCancel}>
                    Cancel Order
                  </Button>
                )}
                {isDraft && can("purchase-orders.delete") && (
                  <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <Descriptions column={{ xs: 1, sm: 2 }} className="mt-4" size="small">
              <Descriptions.Item label="Supplier">{po.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Warehouse">{po.warehouseName}</Descriptions.Item>
              <Descriptions.Item label="Order Date">{dayjs(po.orderDate).format("MMM D, YYYY")}</Descriptions.Item>
              <Descriptions.Item label="Expected Date">
                {po.expectedDate ? dayjs(po.expectedDate).format("MMM D, YYYY") : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">{po.createdByName}</Descriptions.Item>
              {po.approvedByName && (
                <Descriptions.Item label="Approved By">
                  {po.approvedByName} on {dayjs(po.approvedAt).format("MMM D, YYYY")}
                </Descriptions.Item>
              )}
              {po.cancelledByName && (
                <Descriptions.Item label="Cancelled By">
                  {po.cancelledByName} on {dayjs(po.cancelledAt).format("MMM D, YYYY")}
                </Descriptions.Item>
              )}
              {po.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {po.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Line Items" className="rounded-2xl">
            <div className="overflow-x-auto">
              <Table
                dataSource={po.items}
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
                  { title: "Unit Price", key: "unitPrice", align: "right", render: (_, item) => formatCurrency(item.unitPrice) },
                  { title: "Discount", key: "discount", align: "right", render: (_, item) => formatCurrency(item.discount) },
                  { title: "Tax", key: "tax", align: "right", render: (_, item) => formatCurrency(item.tax) },
                  {
                    title: "Total",
                    key: "total",
                    align: "right",
                    render: (_, item) => <span className="font-medium">{formatCurrency(item.totalPrice)}</span>,
                  },
                ]}
              />
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-full sm:w-72 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{formatCurrency(po.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Discount</span>
                  <span>-{formatCurrency(po.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tax</span>
                  <span>+{formatCurrency(po.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-black/10 dark:border-white/10 pt-1 mt-1">
                  <span>Total</span>
                  <span>{formatCurrency(po.totalAmount)}</span>
                </div>
              </div>
            </div>
          </Card>

          <PurchaseOrderFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSuccess={() => {
              load();
              onChanged?.();
            }}
            purchaseOrder={po}
          />
        </div>
      )}
    </Modal>
  );
}
