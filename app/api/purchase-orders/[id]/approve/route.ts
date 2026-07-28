import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { purchaseOrderService, PurchaseOrderServiceError } from "@/services/purchase-order.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("purchase-orders.approve");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    const purchaseOrder = await purchaseOrderService.approve(id, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(purchaseOrder);
  } catch (error) {
    if (error instanceof PurchaseOrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
