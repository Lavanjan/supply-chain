import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { DeliveryTable } from "@/features/deliveries/components/delivery-table";

export const metadata: Metadata = { title: "Deliveries" };

export default async function DeliveriesPage() {
  await requirePermission("deliveries.view");

  return <DeliveryTable />;
}
