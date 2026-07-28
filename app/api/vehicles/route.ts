import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { vehicleSchema, vehicleStatusValues } from "@/lib/validations/vehicle.schema";
import { vehicleService, VehicleServiceError } from "@/services/vehicle.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("vehicles.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const status = new URL(request.url).searchParams.get("status");

  const result = await vehicleService.list({
    ...params,
    status: vehicleStatusValues.includes(status as never) ? (status as never) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("vehicles.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const vehicle = await vehicleService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    if (error instanceof VehicleServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
