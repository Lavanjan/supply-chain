"use client";

import { Badge, Card, Empty, List } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPanel({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          Notifications
          {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
        </span>
      }
      className="rounded-2xl h-full"
    >
      {notifications.length === 0 ? (
        <Empty description="No notifications yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item className={notification.isRead ? "opacity-60" : ""}>
              <List.Item.Meta
                title={notification.title}
                description={
                  <div>
                    <div>{notification.message}</div>
                    <span className="text-xs text-neutral-400">
                      {dayjs(notification.createdAt).fromNow()}
                    </span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
