import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { purchaseOrderSchema } from "@/lib/validations/purchase-order.schema";
import { purchaseOrderService, PurchaseOrderServiceError } from "@/services/purchase-order.service";

const STATUS_VALUES = ["DRAFT", "APPROVED", "COMPLETED", "CANCELLED"];

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("purchase-orders.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get("status");

  const result = await purchaseOrderService.list({
    ...params,
    status: STATUS_VALUES.includes(status ?? "") ? (status as never) : undefined,
    supplierId: searchParams.get("supplierId") ?? undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("purchase-orders.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = purchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const purchaseOrder = await purchaseOrderService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    if (error instanceof PurchaseOrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
