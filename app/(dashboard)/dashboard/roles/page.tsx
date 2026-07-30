import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { PermissionMatrix } from "@/features/roles/components/permission-matrix";

export const metadata: Metadata = { title: "Roles & Permissions" };

export default async function RolesPage() {
  await requirePermission("roles.view");

  return <PermissionMatrix />;
}
