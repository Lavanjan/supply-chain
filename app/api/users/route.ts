import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { userSchema } from "@/lib/validations/user.schema";
import { userService, UserServiceError } from "@/services/user.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("users.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const searchParams = new URL(request.url).searchParams;
  const isActive = searchParams.get("isActive");

  const result = await userService.list({
    ...params,
    roleId: searchParams.get("roleId") ?? undefined,
    isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("users.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const user = await userService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
