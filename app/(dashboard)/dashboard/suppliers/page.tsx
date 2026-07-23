import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { SupplierTable } from "@/features/suppliers/components/supplier-table";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  await requirePermission("suppliers.view");

  return <SupplierTable />;
}
