import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { DriverTable } from "@/features/drivers/components/driver-table";

export const metadata: Metadata = { title: "Drivers" };

export default async function DriversPage() {
  await requirePermission("drivers.view");

  return <DriverTable />;
}
