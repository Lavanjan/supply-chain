"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, type MenuProps } from "antd";
import { NAV_GROUPS } from "@/lib/constants/navigation";
import { usePermission } from "@/hooks/use-permission";

interface NavMenuProps {
  onNavigate?: () => void;
}

export function NavMenu({ onNavigate }: NavMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermission();

  const items: MenuProps["items"] = useMemo(() => {
    return NAV_GROUPS.map((group) => {
      const visibleItems = group.items.filter((item) => can(item.permission));
      if (visibleItems.length === 0) return null;

      return {
        key: group.key,
        type: "group" as const,
        label: group.label,
        children: visibleItems.map((item) => ({
          key: item.href,
          icon: item.icon,
          label: item.label,
        })),
      };
    }).filter(Boolean) as MenuProps["items"];
  }, [can]);

  const selectedKey = useMemo(() => {
    const allHrefs = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href));
    const matches = allHrefs
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length);
    return matches[0] ?? "/dashboard";
  }, [pathname]);

  return (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={[selectedKey]}
      onClick={({ key }) => {
        router.push(key);
        onNavigate?.();
      }}
      className="!border-e-0"
    />
  );
}
