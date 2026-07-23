"use client";

import { Card, Empty, List, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/utils/format";
import type { RecentOrderItem } from "@/types/dashboard.types";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

export function RecentOrders({ orders }: { orders: RecentOrderItem[] }) {
  return (
    <Card title="Recent Orders" className="rounded-2xl h-full">
      {orders.length === 0 ? (
        <Empty description="No purchase orders yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={orders}
          renderItem={(order) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{order.poNumber}</span>
                    <Tag color={STATUS_COLORS[order.status] ?? "default"}>{order.status}</Tag>
                  </div>
                }
                description={
                  <div>
                    <div>{order.supplierName}</div>
                    <span className="text-xs text-neutral-400">
                      {dayjs(order.orderDate).format("MMM D, YYYY")}
                    </span>
                  </div>
                }
              />
              <Typography.Text strong className="tabular-nums shrink-0">
                {formatCurrency(order.totalAmount)}
              </Typography.Text>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
