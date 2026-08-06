import type { RoleName } from "@/lib/generated/prisma/client";

export type { RoleName };

export interface AuthorizedUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: RoleName;
  permissions: string[];
}
