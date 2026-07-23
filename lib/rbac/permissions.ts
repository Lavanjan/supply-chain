import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AuthorizedUser } from "@/types/rbac.types";

export function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes(code);
}

export function hasAnyPermission(permissions: string[], codes: string[]): boolean {
  return codes.some((code) => permissions.includes(code));
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requirePermission(code: string) {
  const session = await requireSession();

  if (!hasPermission(session.user.permissions, code)) {
    redirect("/403");
  }

  return session;
}

export function sessionUserToAuthorizedUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  role: AuthorizedUser["role"];
  permissions: string[];
  avatarUrl: string | null;
}): AuthorizedUser {
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    avatarUrl: user.avatarUrl,
    role: user.role,
    permissions: user.permissions,
  };
}
