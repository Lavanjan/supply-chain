import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { THEME_COOKIE_NAME } from "@/lib/constants/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${isDark ? " dark" : ""}`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
