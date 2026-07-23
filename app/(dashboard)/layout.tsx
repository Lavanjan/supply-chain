import type { ReactNode } from "react";
import { requireSession } from "@/lib/rbac/permissions";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireSession();

  return <DashboardShell>{children}</DashboardShell>;
}
