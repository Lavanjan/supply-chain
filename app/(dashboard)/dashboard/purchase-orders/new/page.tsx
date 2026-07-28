import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { PurchaseOrderForm } from "@/features/purchase-orders/components/purchase-order-form";

export const metadata: Metadata = { title: "New Purchase Order" };

export default async function NewPurchaseOrderPage() {
  await requirePermission("purchase-orders.create");

  return <PurchaseOrderForm />;
}
