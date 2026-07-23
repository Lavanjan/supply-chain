import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { CategoryTable } from "@/features/categories/components/category-table";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requirePermission("categories.view");

  return <CategoryTable />;
}
