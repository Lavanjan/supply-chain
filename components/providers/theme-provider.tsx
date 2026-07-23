"use client";

import { useEffect, type ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import { useThemeStore } from "@/lib/store/theme-store";
import { THEME_COOKIE_MAX_AGE, THEME_COOKIE_NAME } from "@/lib/constants/theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.cookie = `${THEME_COOKIE_NAME}=${mode}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  }, [mode]);

  return (
    <AntdRegistry layer>
      <ConfigProvider
        theme={{
          algorithm: mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: "#1677ff",
            borderRadius: 8,
            fontFamily: "var(--font-sans), sans-serif",
          },
          components: {
            Layout: {
              headerBg: mode === "dark" ? "#141414" : "#ffffff",
              siderBg: mode === "dark" ? "#141414" : "#ffffff",
            },
          },
        }}
      >
        <AntdApp className="min-h-screen">{children}</AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
