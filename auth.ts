import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth/auth.config";
import { authService } from "@/services/auth.service";
import { InvalidCredentialsError } from "@/lib/auth/errors";
import { getClientIp } from "@/lib/utils/request";
import { SESSION_MAX_AGE_REMEMBER_SECONDS, SESSION_MAX_AGE_SECONDS } from "@/lib/constants/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(credentials, request) {
        const username = typeof credentials?.username === "string" ? credentials.username : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!username || !password) {
          throw new InvalidCredentialsError();
        }

        const ip = getClientIp(request);
        const user = await authService.validateCredentials(username, password, ip);

        return {
          ...user,
          remember: credentials?.remember === "true",
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = await authConfig.callbacks!.jwt!(params);

      if (token && params.user) {
        const remember = (params.user as { remember?: boolean }).remember;

        // Auth.js honors a manually-set token.exp when present, which is what lets
        // "remember me" grant a longer-lived session than the default maxAge.
        const maxAge = remember ? SESSION_MAX_AGE_REMEMBER_SECONDS : SESSION_MAX_AGE_SECONDS;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }

      return token;
    },
  },
});
