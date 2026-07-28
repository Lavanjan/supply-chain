import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { warehouseSchema } from "@/lib/validations/warehouse.schema";
import { warehouseService, WarehouseServiceError } from "@/services/warehouse.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("warehouses.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const result = await warehouseService.list(params);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("warehouses.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = warehouseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const warehouse = await warehouseService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    if (error instanceof WarehouseServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
