"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { RoleOption } from "@/types/user.types";

export function useRoleOptions() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<RoleOption[]>("/api/users/role-options")
      .then((result) => {
        if (!cancelled) setRoles(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { roles, loading };
}
