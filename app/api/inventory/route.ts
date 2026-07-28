import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { inventoryService } from "@/services/inventory.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("inventory.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const searchParams = new URL(request.url).searchParams;

  const result = await inventoryService.listStock({
    ...params,
    warehouseId: searchParams.get("warehouseId") ?? undefined,
    lowStockOnly: searchParams.get("lowStockOnly") === "true",
  });
  return NextResponse.json(result);
}
