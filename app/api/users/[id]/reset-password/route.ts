import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { resetUserPasswordSchema } from "@/lib/validations/user.schema";
import { userService, UserServiceError } from "@/services/user.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("users.update");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = resetUserPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    await userService.resetPassword(id, parsed.data.password, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
