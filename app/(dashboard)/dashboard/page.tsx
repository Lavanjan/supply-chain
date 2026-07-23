import type { Metadata } from "next";
import dayjs from "dayjs";
import { requireSession } from "@/lib/rbac/permissions";
import { QuickAccess } from "@/features/dashboard/components/quick-access";
import { WelcomeCard } from "@/features/dashboard/components/welcome-card";
import { StatsGrid } from "@/features/dashboard/components/stats-grid";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";
import { RecentActivities } from "@/features/dashboard/components/recent-activities";
import { RecentOrders } from "@/features/dashboard/components/recent-orders";
import { NotificationsPanel } from "@/features/dashboard/components/notifications-panel";
import { dashboardService } from "@/services/dashboard.service";
import { notificationService } from "@/services/notification.service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  const { user } = session;
  const firstName = (user.name ?? user.email ?? "").split(" ")[0] ?? "";

  const [stats, recentActivities, recentOrders, notificationSummary] = await Promise.all([
    dashboardService.getStats(),
    dashboardService.getRecentActivities(),
    dashboardService.getRecentOrders(),
    notificationService.getInboxSummary(user.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <WelcomeCard
        firstName={firstName}
        role={user.role}
        formattedDate={dayjs().format("dddd, MMMM D, YYYY")}
      />
      <QuickAccess permissions={user.permissions} />

      <StatsGrid stats={stats} />

      <DashboardCharts />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <RecentActivities activities={recentActivities} />
        <RecentOrders orders={recentOrders} />
        <NotificationsPanel
          notifications={notificationSummary.notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead,
            createdAt: notification.createdAt.toISOString(),
          }))}
          unreadCount={notificationSummary.unreadCount}
        />
      </div>
    </div>
  );
}
