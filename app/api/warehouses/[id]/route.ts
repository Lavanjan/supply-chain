import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { warehouseSchema } from "@/lib/validations/warehouse.schema";
import { warehouseService, WarehouseServiceError } from "@/services/warehouse.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("warehouses.update");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = warehouseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const warehouse = await warehouseService.update(id, parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(warehouse);
  } catch (error) {
    if (error instanceof WarehouseServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("warehouses.delete");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    await warehouseService.remove(id, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof WarehouseServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
