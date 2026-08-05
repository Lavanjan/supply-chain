"use client";

import { Card, Tag, Typography } from "antd";
import { useTranslations } from "next-intl";
import type { RoleName } from "@/types/rbac.types";

interface WelcomeCardProps {
  firstName: string;
  role: RoleName;
  formattedDate: string;
}

export function WelcomeCard({ firstName, role, formattedDate }: WelcomeCardProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common.header");

  return (
    <Card className="rounded-2xl">
      <Typography.Title level={3} className="!mb-1">
        {t("welcomeBack", { name: firstName })}
      </Typography.Title>
      <Typography.Text type="secondary">
        {formattedDate} ·{" "}
        <Tag color={role === "ADMIN" ? "blue" : "green"}>
          {role === "ADMIN" ? tCommon("roleAdministrator") : tCommon("roleManager")}
        </Tag>
      </Typography.Text>
    </Card>
  );
}
