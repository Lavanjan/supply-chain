import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { purchaseOrderService } from "@/services/purchase-order.service";

export async function GET() {
  const guard = await requireApiPermission("goods-receive-notes.create");
  if (isGuardFailure(guard)) return guard.response;

  const options = await purchaseOrderService.getReceivableOptions();
  return NextResponse.json(options);
}
