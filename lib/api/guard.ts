import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/rbac/permissions";
import type { Session } from "next-auth";

type GuardResult = { session: Session } | { response: NextResponse };

export async function requireApiPermission(code: string): Promise<GuardResult> {
  const session = await auth();

  if (!session?.user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!hasPermission(session.user.permissions, code)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

export function isGuardFailure(result: GuardResult): result is { response: NextResponse } {
  return "response" in result;
}
