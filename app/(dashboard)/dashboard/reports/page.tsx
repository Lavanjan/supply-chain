import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { ReportsTabs } from "@/features/reports/components/reports-tabs";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePermission("reports.view");

  return <ReportsTabs />;
}
