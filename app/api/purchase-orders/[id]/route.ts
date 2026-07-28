import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { purchaseOrderSchema } from "@/lib/validations/purchase-order.schema";
import { purchaseOrderService, PurchaseOrderServiceError } from "@/services/purchase-order.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("purchase-orders.view");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;
  try {
    const purchaseOrder = await purchaseOrderService.getById(id);
    return NextResponse.json(purchaseOrder);
  } catch (error) {
    if (error instanceof PurchaseOrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("purchase-orders.update");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = purchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const purchaseOrder = await purchaseOrderService.update(id, parsed.data, {
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("purchase-orders.delete");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    await purchaseOrderService.remove(id, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof PurchaseOrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
