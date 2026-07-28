import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { DeliveryForm } from "@/features/deliveries/components/delivery-form";

export const metadata: Metadata = { title: "New Delivery" };

export default async function NewDeliveryPage() {
  await requirePermission("deliveries.create");

  return <DeliveryForm />;
}
