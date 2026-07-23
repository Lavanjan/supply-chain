"use client";

import { Layout, Typography } from "antd";
import { MenuFoldOutlined, MenuOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { useUiStore } from "@/lib/store/ui-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { getPageTitle } from "@/lib/utils/navigation";
import { HEADER_HEIGHT } from "@/lib/constants/layout";

const { Header: AntHeader } = Layout;

export function Header() {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);
  const openMobileDrawer = useUiStore((state) => state.openMobileDrawer);

  return (
    <AntHeader
      style={{ height: HEADER_HEIGHT }}
      className="!bg-white dark:!bg-neutral-900 !px-4 sm:!px-6 flex items-center justify-between border-b border-black/5 dark:border-white/10 sticky top-0 z-10"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label={isMobile ? "Open navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={isMobile ? openMobileDrawer : toggleSidebarCollapsed}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-lg shrink-0"
        >
          {isMobile ? <MenuOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
        <Typography.Title level={4} className="!mb-0 !text-base sm:!text-lg truncate">
          {getPageTitle(pathname)}
        </Typography.Title>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </AntHeader>
  );
}
