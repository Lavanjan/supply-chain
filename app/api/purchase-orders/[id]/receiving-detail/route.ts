import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { purchaseOrderService, PurchaseOrderServiceError } from "@/services/purchase-order.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("goods-receive-notes.create");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    const detail = await purchaseOrderService.getReceivingDetail(id);
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof PurchaseOrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
