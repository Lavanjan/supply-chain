import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { CustomerTable } from "@/features/customers/components/customer-table";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  await requirePermission("customers.view");

  return <CustomerTable />;
}
