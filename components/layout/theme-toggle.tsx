"use client";

import { Button, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useThemeStore } from "@/lib/store/theme-store";

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggle);
  const t = useTranslations("common.header");

  return (
    <Tooltip title={mode === "dark" ? t("switchToLightMode") : t("switchToDarkMode")}>
      <Button
        type="text"
        shape="circle"
        aria-label={t("toggleTheme")}
        icon={mode === "dark" ? <SunOutlined className="text-lg" /> : <MoonOutlined className="text-lg" />}
        onClick={toggle}
      />
    </Tooltip>
  );
}
