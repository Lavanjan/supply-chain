import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { unitSchema } from "@/lib/validations/unit.schema";
import { unitService, UnitServiceError } from "@/services/unit.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("units.update");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const unit = await unitService.update(id, parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(unit);
  } catch (error) {
    if (error instanceof UnitServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("units.delete");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    await unitService.remove(id, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UnitServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
