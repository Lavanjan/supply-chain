import type { RoleName } from "@/lib/generated/prisma/client";

export interface UserListItem {
  id: string;
  name: string;
  username: string;
  phone: string | null;
  roleId: string;
  roleName: RoleName;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface RoleOption {
  id: string;
  name: RoleName;
}
