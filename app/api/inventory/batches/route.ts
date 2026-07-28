import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { inventoryService } from "@/services/inventory.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("inventory.view");
  if (isGuardFailure(guard)) return guard.response;

  const searchParams = new URL(request.url).searchParams;
  const productId = searchParams.get("productId");
  const warehouseId = searchParams.get("warehouseId");

  if (!productId || !warehouseId) {
    return NextResponse.json({ error: "productId and warehouseId are required" }, { status: 400 });
  }

  const batches = await inventoryService.getBatches(productId, warehouseId);
  return NextResponse.json(batches);
}
