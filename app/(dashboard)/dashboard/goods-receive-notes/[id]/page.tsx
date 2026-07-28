import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { GoodsReceiveNoteDetail } from "@/features/goods-receive-notes/components/grn-detail";

export const metadata: Metadata = { title: "Goods Receive Note" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GoodsReceiveNoteDetailPage({ params }: PageProps) {
  await requirePermission("goods-receive-notes.view");
  const { id } = await params;

  return <GoodsReceiveNoteDetail id={id} />;
}
