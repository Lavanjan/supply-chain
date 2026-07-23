import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { UnitTable } from "@/features/units/components/unit-table";

export const metadata: Metadata = { title: "Units" };

export default async function UnitsPage() {
  await requirePermission("units.view");

  return <UnitTable />;
}
