import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { inventoryService } from "@/services/inventory.service";
import type { InventoryMovementType } from "@/lib/generated/prisma/client";

const MOVEMENT_TYPES = ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT"];

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("inventory.view");
  if (isGuardFailure(guard)) return guard.response;

  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 10);
  const type = searchParams.get("type");

  const result = await inventoryService.listHistory({
    page,
    pageSize,
    productId: searchParams.get("productId") ?? undefined,
    warehouseId: searchParams.get("warehouseId") ?? undefined,
    type: MOVEMENT_TYPES.includes(type ?? "") ? (type as InventoryMovementType) : undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });
  return NextResponse.json(result);
}
