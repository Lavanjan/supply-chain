"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, Dropdown, type MenuProps } from "antd";
import { TranslationOutlined } from "@ant-design/icons";
import { locales, LOCALE_LABELS, LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("common.header");
  const [isPending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  const items: MenuProps["items"] = locales.map((code) => ({
    key: code,
    label: LOCALE_LABELS[code],
    onClick: () => setLocale(code),
  }));

  return (
    <Dropdown menu={{ items, selectedKeys: [locale] }} trigger={["click"]} placement="bottomRight">
      <Button
        type="text"
        shape="circle"
        aria-label={t("changeLanguage")}
        loading={isPending}
        icon={<TranslationOutlined className="text-lg" />}
      />
    </Dropdown>
  );
}
