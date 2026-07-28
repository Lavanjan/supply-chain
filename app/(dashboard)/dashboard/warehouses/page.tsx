import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { WarehouseTable } from "@/features/warehouses/components/warehouse-table";

export const metadata: Metadata = { title: "Warehouses" };

export default async function WarehousesPage() {
  await requirePermission("warehouses.view");

  return <WarehouseTable />;
}
