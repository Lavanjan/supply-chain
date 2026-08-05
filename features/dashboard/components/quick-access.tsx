"use client";

import Link from "next/link";
import { Card } from "antd";
import { useTranslations } from "next-intl";
import { NAV_GROUPS } from "@/lib/constants/navigation";

export function QuickAccess({ permissions }: { permissions: string[] }) {
  const t = useTranslations("dashboard");
  const tItems = useTranslations("nav.items");
  const quickLinks = NAV_GROUPS.flatMap((group) => group.items)
    .filter((item) => item.href !== "/dashboard" && permissions.includes(item.permission))
    .slice(0, 8);

  return (
    <Card title={t("quickAccess")} className="rounded-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-xl border border-black/5 dark:border-white/10 px-4 py-3 hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <span className="text-lg text-blue-600">{link.icon}</span>
            <span className="text-sm font-medium">{tItems(link.key)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
