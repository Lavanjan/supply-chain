"use client";

import { useSession } from "next-auth/react";

export function usePermission() {
  const { data: session } = useSession();
  const permissions = session?.user.permissions ?? [];

  return {
    can: (code: string) => permissions.includes(code),
    canAny: (codes: string[]) => codes.some((code) => permissions.includes(code)),
    role: session?.user.role,
    permissions,
  };
}
