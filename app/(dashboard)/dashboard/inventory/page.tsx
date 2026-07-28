import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { InventoryPageClient } from "@/features/inventory/components/inventory-page-client";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  await requirePermission("inventory.view");

  return <InventoryPageClient />;
}
