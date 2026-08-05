import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/rbac/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailPage({ params }: PageProps) {
  await requirePermission("purchase-orders.view");
  const { id } = await params;

  redirect(`/dashboard/purchase-orders?view=${id}`);
}
