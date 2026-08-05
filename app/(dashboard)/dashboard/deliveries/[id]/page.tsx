import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/rbac/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeliveryDetailPage({ params }: PageProps) {
  await requirePermission("deliveries.view");
  const { id } = await params;

  redirect(`/dashboard/deliveries?view=${id}`);
}
