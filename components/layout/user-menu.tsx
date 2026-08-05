"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, Dropdown, Tag, Typography, type MenuProps } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";

export function UserMenu() {
  const { data: session } = useSession();
  const t = useTranslations("common.header");

  if (!session?.user) return null;

  const { name, email, role, avatarUrl } = session.user;

  const items: MenuProps["items"] = [
    {
      key: "profile-info",
      label: (
        <div className="px-1 py-1">
          <Typography.Text strong className="block">
            {name}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs block">
            {email}
          </Typography.Text>
          <Tag color={role === "ADMIN" ? "blue" : "green"} className="mt-1">
            {role === "ADMIN" ? t("roleAdministrator") : t("roleManager")}
          </Tag>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "logout",
      label: t("signOut"),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => signOut({ callbackUrl: "/login" }),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full px-1.5 py-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <Avatar src={avatarUrl} icon={<UserOutlined />} />
        <span className="hidden sm:inline text-sm font-medium max-w-[10rem] truncate">
          {name}
        </span>
      </button>
    </Dropdown>
  );
}
