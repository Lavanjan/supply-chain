"use client";

import type { ReactNode } from "react";
import { SessionProvider, type SessionProviderProps } from "next-auth/react";
import { ThemeProvider } from "@/components/providers/theme-provider";

interface AppProvidersProps {
  session: SessionProviderProps["session"];
  children: ReactNode;
}

export function AppProviders({ session, children }: AppProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
