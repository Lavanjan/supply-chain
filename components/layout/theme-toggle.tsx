"use client";

import { Button, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useThemeStore } from "@/lib/store/theme-store";

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggle);

  return (
    <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      <Button
        type="text"
        shape="circle"
        aria-label="Toggle theme"
        icon={mode === "dark" ? <SunOutlined className="text-lg" /> : <MoonOutlined className="text-lg" />}
        onClick={toggle}
      />
    </Tooltip>
  );
}
