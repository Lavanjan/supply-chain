import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import {
  ADMIN_ONLY_ROUTE_PREFIXES,
  DEFAULT_LOGIN_REDIRECT,
  PUBLIC_ROUTES,
} from "@/lib/constants/routes";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/constants/auth";
import type { AuthorizedUser } from "@/types/rbac.types";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authorizedUser = user as AuthorizedUser & { remember?: boolean };
        token.userId = authorizedUser.id;
        token.role = authorizedUser.role;
        token.permissions = authorizedUser.permissions;
        token.name = authorizedUser.name;
        token.email = authorizedUser.email;
        token.avatarUrl = authorizedUser.avatarUrl;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.role = token.role as AuthorizedUser["role"];
      session.user.permissions = token.permissions as string[];
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.avatarUrl = token.avatarUrl as string | null;

      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);
      const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

      if (isPublicRoute) {
        if (isLoggedIn && pathname === "/login") {
          return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      const isAdminOnlyRoute = ADMIN_ONLY_ROUTE_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
      );

      if (isAdminOnlyRoute && auth?.user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/403", request.nextUrl));
      }

      return true;
    },
  },
};
