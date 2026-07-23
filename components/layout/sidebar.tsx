"use client";

import { Drawer, Layout } from "antd";
import { NavMenu } from "@/components/layout/nav-menu";
import { Logo } from "@/components/layout/logo";
import { useUiStore } from "@/lib/store/ui-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { HEADER_HEIGHT, SIDER_COLLAPSED_WIDTH, SIDER_WIDTH } from "@/lib/constants/layout";

const { Sider } = Layout;

export function Sidebar() {
  const isMobile = useIsMobile();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileDrawerOpen = useUiStore((state) => state.mobileDrawerOpen);
  const closeMobileDrawer = useUiStore((state) => state.closeMobileDrawer);

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={closeMobileDrawer}
        closable
        title={<Logo />}
        width={280}
        styles={{ body: { padding: 0 }, header: { paddingBlock: 12 } }}
      >
        <NavMenu onNavigate={closeMobileDrawer} />
      </Drawer>
    );
  }

  return (
    <Sider
      width={SIDER_WIDTH}
      collapsedWidth={SIDER_COLLAPSED_WIDTH}
      collapsed={collapsed}
      trigger={null}
      theme="light"
      style={{
        position: "fixed",
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
        overflow: "auto",
        zIndex: 20,
      }}
      className="!bg-white dark:!bg-neutral-900 border-e border-black/5 dark:border-white/10"
    >
      <div
        className="flex items-center px-4 border-b border-black/5 dark:border-white/10"
        style={{ height: HEADER_HEIGHT }}
      >
        <Logo collapsed={collapsed} />
      </div>
      <NavMenu />
    </Sider>
  );
}
