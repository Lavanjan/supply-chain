import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { UserTable } from "@/features/users/components/user-table";

export const metadata: Metadata = { title: "User Management" };

export default async function UsersPage() {
  await requirePermission("users.view");

  return <UserTable />;
}
