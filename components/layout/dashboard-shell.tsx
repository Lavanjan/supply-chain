"use client";

import type { ReactNode } from "react";
import { Layout } from "antd";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useUiStore } from "@/lib/store/ui-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { SIDER_COLLAPSED_WIDTH, SIDER_WIDTH } from "@/lib/constants/layout";

const { Content } = Layout;

export function DashboardShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  const marginInlineStart = isMobile ? 0 : collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH;

  return (
    <Layout style={{ minHeight: "100vh" }} className="!bg-neutral-50 dark:!bg-neutral-950">
      <Sidebar />
      <Layout style={{ marginInlineStart, transition: "margin-inline-start 0.2s" }}>
        <Header />
        <Content className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">{children}</Content>
        <Footer />
      </Layout>
    </Layout>
  );
}
