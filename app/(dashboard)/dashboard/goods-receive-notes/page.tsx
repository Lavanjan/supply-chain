import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { GoodsReceiveNoteTable } from "@/features/goods-receive-notes/components/grn-table";

export const metadata: Metadata = { title: "Goods Receive Notes" };

export default async function GoodsReceiveNotesPage() {
  await requirePermission("goods-receive-notes.view");

  return <GoodsReceiveNoteTable />;
}
