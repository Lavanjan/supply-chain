"use client";

import { Card, Tag, Typography } from "antd";
import type { RoleName } from "@/types/rbac.types";

interface WelcomeCardProps {
  firstName: string;
  role: RoleName;
  formattedDate: string;
}

export function WelcomeCard({ firstName, role, formattedDate }: WelcomeCardProps) {
  return (
    <Card className="rounded-2xl">
      <Typography.Title level={3} className="!mb-1">
        Welcome back, {firstName}
      </Typography.Title>
      <Typography.Text type="secondary">
        {formattedDate} ·{" "}
        <Tag color={role === "ADMIN" ? "blue" : "green"}>
          {role === "ADMIN" ? "Administrator" : "Manager"}
        </Tag>
      </Typography.Text>
    </Card>
  );
}
