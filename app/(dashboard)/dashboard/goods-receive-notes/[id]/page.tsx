import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/rbac/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GoodsReceiveNoteDetailPage({ params }: PageProps) {
  await requirePermission("goods-receive-notes.view");
  const { id } = await params;

  redirect(`/dashboard/goods-receive-notes?view=${id}`);
}
