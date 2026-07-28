import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { driverSchema, driverStatusValues } from "@/lib/validations/driver.schema";
import { driverService, DriverServiceError } from "@/services/driver.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("drivers.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const status = new URL(request.url).searchParams.get("status");

  const result = await driverService.list({
    ...params,
    status: driverStatusValues.includes(status as never) ? (status as never) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("drivers.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = driverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const driver = await driverService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    if (error instanceof DriverServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
