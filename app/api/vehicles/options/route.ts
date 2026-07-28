import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { vehicleService } from "@/services/vehicle.service";

export async function GET() {
  const guard = await requireApiPermission("vehicles.view");
  if (isGuardFailure(guard)) return guard.response;

  const options = await vehicleService.getOptions();
  return NextResponse.json(options);
}
