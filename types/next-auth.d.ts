import type { DefaultSession } from "next-auth";
import type { RoleName } from "@/lib/generated/prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: RoleName;
    permissions: string[];
    avatarUrl: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: RoleName;
      permissions: string[];
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: RoleName;
    permissions?: string[];
    avatarUrl?: string | null;
  }
}
