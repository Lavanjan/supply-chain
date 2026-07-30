import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { userService } from "@/services/user.service";

export async function GET() {
  const guard = await requireApiPermission("users.view");
  if (isGuardFailure(guard)) return guard.response;

  const roles = await userService.getRoleOptions();
  return NextResponse.json(roles);
}
