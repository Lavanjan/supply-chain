import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { ProductTable } from "@/features/products/components/product-table";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  await requirePermission("products.view");

  return <ProductTable />;
}
