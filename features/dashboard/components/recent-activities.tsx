"use client";

import { Card, Empty, List, Tag } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { RecentActivityItem } from "@/types/dashboard.types";

dayjs.extend(relativeTime);

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "blue",
  LOGOUT: "default",
  LOGIN_FAILED: "red",
  CREATE: "green",
  UPDATE: "gold",
  DELETE: "red",
  APPROVE: "cyan",
  CANCEL: "orange",
  RESTORE: "purple",
};

export function RecentActivities({ activities }: { activities: RecentActivityItem[] }) {
  return (
    <Card title="Recent Activities" className="rounded-2xl h-full">
      {activities.length === 0 ? (
        <Empty description="No activity yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={activities}
          renderItem={(activity) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag color={ACTION_COLORS[activity.action] ?? "default"}>{activity.action}</Tag>
                    <span className="text-sm font-normal text-neutral-500">{activity.module}</span>
                  </div>
                }
                description={
                  <div>
                    <div>{activity.description ?? `${activity.userName} performed an action`}</div>
                    <span className="text-xs text-neutral-400">
                      {activity.userName} · {dayjs(activity.createdAt).fromNow()}
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
