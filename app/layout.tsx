import type { Metadata } from "next";
import { Ubuntu, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { THEME_COOKIE_NAME } from "@/lib/constants/theme";
import { defaultLocale, isLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Supply Chain & Inventory Management System",
    template: "%s | Supply Chain & Inventory Management System",
  },
  description:
    "Enterprise inventory and supply chain management for prisons, hospitals, government institutions, schools, hotels and companies.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);
  const isDark = cookieStore.get(THEME_COOKIE_NAME)?.value === "dark";
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const messages = await getMessages(locale);

  return (
    <html
      lang={locale}
      className={`${ubuntu.variable} ${geistMono.variable} h-full antialiased${isDark ? " dark" : ""}`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders session={session} locale={locale} messages={messages}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
