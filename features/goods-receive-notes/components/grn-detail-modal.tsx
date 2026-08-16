"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Descriptions, Skeleton, Table, Tag, Typography } from "antd";
import { Modal } from "@/components/ui/modal";
import { DownloadOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { apiClient } from "@/lib/api/client";
import type { GoodsReceiveNoteDetail as GrnDetailType } from "@/types/goods-receive-note.types";

interface GoodsReceiveNoteDetailModalProps {
  open: boolean;
  id: string | null;
  onClose: () => void;
}

export function GoodsReceiveNoteDetailModal({ open, id, onClose }: GoodsReceiveNoteDetailModalProps) {
  const [grn, setGrn] = useState<GrnDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && id) {
      setLoading(true);
      apiClient
        .get<GrnDetailType>(`/api/goods-receive-notes/${id}`)
        .then(setGrn)
        .catch(() => setGrn(null))
        .finally(() => setLoading(false));
    }
  }, [open, id]);

  return (
    <Modal
      title={grn?.grnNumber ?? "Goods Receive Note"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      destroyOnHidden
    >
      {loading && <Skeleton active paragraph={{ rows: 8 }} />}

      {!loading && !grn && <Typography.Text type="danger">Goods receive note not found.</Typography.Text>}

      {!loading && grn && (
        <div className="flex flex-col gap-4">
          <Card className="rounded-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Tag color="green">{grn.status}</Tag>
              <div className="flex flex-wrap gap-2">
                <a href={`/api/goods-receive-notes/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                  <Button icon={<DownloadOutlined />}>Print</Button>
                </a>
                <Link href={`/dashboard/purchase-orders?view=${grn.purchaseOrderId}`}>
                  <Button icon={<FileTextOutlined />}>View Purchase Order</Button>
                </Link>
              </div>
            </div>

            <Descriptions column={{ xs: 1, sm: 2 }} className="mt-4" size="small">
              <Descriptions.Item label="Purchase Order">{grn.poNumber}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{grn.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Warehouse">{grn.warehouseName}</Descriptions.Item>
              <Descriptions.Item label="Received Date">{dayjs(grn.receivedDate).format("MMM D, YYYY")}</Descriptions.Item>
              <Descriptions.Item label="Received By">{grn.receivedByName}</Descriptions.Item>
              {grn.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {grn.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Received Items" className="rounded-2xl">
            <div className="overflow-x-auto">
              <Table
                dataSource={grn.items}
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
                    title: "Ordered",
                    key: "ordered",
                    align: "right",
                    render: (_, item) => `${item.orderedQuantity} ${item.unitSymbol}`,
                  },
                  {
                    title: "Received",
                    key: "received",
                    align: "right",
                    render: (_, item) => (
                      <span className="font-medium">
                        {item.receivedQuantity} {item.unitSymbol}
                      </span>
                    ),
                  },
                  {
                    title: "Wasted",
                    key: "wasted",
                    align: "right",
                    render: (_, item) =>
                      item.wastedQuantity > 0 ? (
                        <span className="font-medium text-red-500">
                          {item.wastedQuantity} {item.unitSymbol}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      ),
                  },
                  {
                    title: "Batch",
                    dataIndex: "batchNumber",
                    render: (value: string | null) => value || <span className="text-neutral-400">—</span>,
                  },
                  {
                    title: "Expiry Date",
                    dataIndex: "expiryDate",
                    render: (value: string | null) => (value ? dayjs(value).format("MMM D, YYYY") : <span className="text-neutral-400">—</span>),
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
}
