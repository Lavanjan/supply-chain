import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { VehicleTable } from "@/features/vehicles/components/vehicle-table";

export const metadata: Metadata = { title: "Vehicles" };

export default async function VehiclesPage() {
  await requirePermission("vehicles.view");

  return <VehicleTable />;
}
