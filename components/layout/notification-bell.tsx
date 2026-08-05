"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Empty, List, Popover, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslations } from "next-intl";

dayjs.extend(relativeTime);

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const t = useTranslations("common.header");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 60_000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  async function handleMarkAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    fetchSummary();
  }

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      onOpenChange={(open) => open && fetchSummary()}
      content={
        <div className="w-80 max-w-[85vw]">
          <div className="flex items-center justify-between px-1 pb-2">
            <Typography.Text strong>{t("notifications")}</Typography.Text>
            {unreadCount > 0 && (
              <Button type="link" onClick={handleMarkAllRead}>
                {t("markAllRead")}
              </Button>
            )}
          </div>
          <List
            loading={loading}
            dataSource={notifications}
            locale={{ emptyText: <Empty description={t("noNotificationsYet")} /> }}
            renderItem={(item) => (
              <List.Item className={item.isRead ? "opacity-60" : ""}>
                <List.Item.Meta
                  title={item.title}
                  description={
                    <div>
                      <div>{item.message}</div>
                      <Typography.Text type="secondary" className="text-xs">
                        {dayjs(item.createdAt).fromNow()}
                      </Typography.Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      }
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button type="text" shape="circle" icon={<BellOutlined className="text-lg" />} />
      </Badge>
    </Popover>
  );
}
