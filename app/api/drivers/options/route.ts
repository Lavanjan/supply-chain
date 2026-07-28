import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { driverService } from "@/services/driver.service";

export async function GET() {
  const guard = await requireApiPermission("drivers.view");
  if (isGuardFailure(guard)) return guard.response;

  const options = await driverService.getOptions();
  return NextResponse.json(options);
}
