import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { unitSchema } from "@/lib/validations/unit.schema";
import { unitService, UnitServiceError } from "@/services/unit.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("units.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const result = await unitService.list(params);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("units.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const unit = await unitService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    if (error instanceof UnitServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
