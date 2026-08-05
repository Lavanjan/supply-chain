"use client";

import { Layout, Typography } from "antd";
import { useTranslations } from "next-intl";

const { Footer: AntFooter } = Layout;

export function Footer() {
  const t = useTranslations("common.footer");

  return (
    <AntFooter className="!bg-transparent !px-4 sm:!px-6 !py-4 text-center">
      <Typography.Text type="secondary" className="text-xs">
        {t("copyright", { year: new Date().getFullYear() })}
      </Typography.Text>
    </AntFooter>
  );
}
