import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { DeliveryDetail } from "@/features/deliveries/components/delivery-detail";

export const metadata: Metadata = { title: "Delivery" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeliveryDetailPage({ params }: PageProps) {
  await requirePermission("deliveries.view");
  const { id } = await params;

  return <DeliveryDetail id={id} />;
}
