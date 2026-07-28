"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Descriptions, Skeleton, Table, Tag, Typography } from "antd";
import { DownloadOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { apiClient } from "@/lib/api/client";
import type { GoodsReceiveNoteDetail as GrnDetailType } from "@/types/goods-receive-note.types";

export function GoodsReceiveNoteDetail({ id }: { id: string }) {
  const [grn, setGrn] = useState<GrnDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<GrnDetailType>(`/api/goods-receive-notes/${id}`)
      .then(setGrn)
      .catch(() => setGrn(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (!grn) {
    return (
      <Card className="rounded-2xl">
        <Typography.Text type="danger">Goods receive note not found.</Typography.Text>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Typography.Title level={3} className="!mb-1">
              {grn.grnNumber}
            </Typography.Title>
            <Tag color="green">{grn.status}</Tag>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/goods-receive-notes/${id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Button icon={<DownloadOutlined />}>Print</Button>
            </a>
            <Link href={`/dashboard/purchase-orders/${grn.purchaseOrderId}`}>
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
  );
}
