import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { AuditLogTable } from "@/features/audit-logs/components/audit-log-table";

export const metadata: Metadata = { title: "Audit Logs" };

export default async function AuditLogsPage() {
  await requirePermission("audit-logs.view");

  return <AuditLogTable />;
}
