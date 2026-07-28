import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { GoodsReceiveNoteForm } from "@/features/goods-receive-notes/components/grn-form";

export const metadata: Metadata = { title: "Receive Goods" };

export default async function NewGoodsReceiveNotePage() {
  await requirePermission("goods-receive-notes.create");

  return <GoodsReceiveNoteForm />;
}
