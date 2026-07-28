import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/rbac/permissions";
import { purchaseOrderService } from "@/services/purchase-order.service";
import { PurchaseOrderForm } from "@/features/purchase-orders/components/purchase-order-form";

export const metadata: Metadata = { title: "Edit Purchase Order" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPurchaseOrderPage({ params }: PageProps) {
  await requirePermission("purchase-orders.update");
  const { id } = await params;

  const purchaseOrder = await purchaseOrderService.getById(id).catch(() => null);

  if (!purchaseOrder) {
    redirect("/dashboard/purchase-orders");
  }

  if (purchaseOrder.status !== "DRAFT") {
    redirect(`/dashboard/purchase-orders/${id}`);
  }

  return <PurchaseOrderForm purchaseOrder={purchaseOrder} />;
}
