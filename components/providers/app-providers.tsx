"use client";

import type { ReactNode } from "react";
import { SessionProvider, type SessionProviderProps } from "next-auth/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Locale } from "@/lib/i18n/config";

interface AppProvidersProps {
  session: SessionProviderProps["session"];
  locale: Locale;
  messages: AbstractIntlMessages;
  children: ReactNode;
}

export function AppProviders({ session, locale, messages, children }: AppProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider session={session}>
        <ThemeProvider>{children}</ThemeProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
