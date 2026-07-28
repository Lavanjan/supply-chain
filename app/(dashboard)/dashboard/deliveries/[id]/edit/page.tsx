import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/rbac/permissions";
import { deliveryService } from "@/services/delivery.service";
import { DeliveryForm } from "@/features/deliveries/components/delivery-form";

export const metadata: Metadata = { title: "Edit Delivery" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDeliveryPage({ params }: PageProps) {
  await requirePermission("deliveries.update");
  const { id } = await params;

  const delivery = await deliveryService.getById(id).catch(() => null);

  if (!delivery) {
    redirect("/dashboard/deliveries");
  }

  if (delivery.status !== "PENDING") {
    redirect(`/dashboard/deliveries/${id}`);
  }

  return <DeliveryForm delivery={delivery} />;
}
