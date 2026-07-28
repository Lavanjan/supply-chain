import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { PurchaseOrderTable } from "@/features/purchase-orders/components/purchase-order-table";

export const metadata: Metadata = { title: "Purchase Orders" };

export default async function PurchaseOrdersPage() {
  await requirePermission("purchase-orders.view");

  return <PurchaseOrderTable />;
}
