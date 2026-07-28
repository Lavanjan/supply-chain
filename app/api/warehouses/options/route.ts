import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { warehouseService } from "@/services/warehouse.service";

export async function GET() {
  const guard = await requireApiPermission("warehouses.view");
  if (isGuardFailure(guard)) return guard.response;

  const options = await warehouseService.getOptions();
  return NextResponse.json(options);
}
