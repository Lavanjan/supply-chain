import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { PurchaseOrderDetail } from "@/features/purchase-orders/components/purchase-order-detail";

export const metadata: Metadata = { title: "Purchase Order" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailPage({ params }: PageProps) {
  await requirePermission("purchase-orders.view");
  const { id } = await params;

  return <PurchaseOrderDetail id={id} />;
}
