"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { FormField } from "@/components/ui/form-field";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth.schema";
import { resetPasswordAction } from "@/features/auth/actions/reset-password.action";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useTranslations("auth.resetPassword");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await resetPasswordAction({ ...values, token });
      if (!response.success) {
        setErrorMessage(response.message);
        return;
      }
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Card className="shadow-lg rounded-2xl" styles={{ body: { padding: "2rem" } }}>
        <Typography.Title level={3} className="!mb-2">
          {t("invalidLinkTitle")}
        </Typography.Title>
        <Typography.Text type="secondary">{t("invalidLinkDescription")}</Typography.Text>
        <div className="mt-4">
          <a href="/forgot-password" className="text-blue-600 hover:underline">
            {t("requestNewLink")}
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl" styles={{ body: { padding: "2rem" } }}>
      <div className="mb-6 text-center">
        <Typography.Title level={3} className="!mb-1">
          {t("title")}
        </Typography.Title>
        <Typography.Text type="secondary">{t("subtitle")}</Typography.Text>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="password" label={t("newPasswordLabel")} required>
          {(field) => (
            <Input.Password
              {...field}
              autoComplete="new-password"
              prefix={<LockOutlined className="text-neutral-400" />}
              placeholder="••••••••"
              status={errors.password ? "error" : ""}
            />
          )}
        </FormField>

        <FormField control={control} name="confirmPassword" label={t("confirmPasswordLabel")} required>
          {(field) => (
            <Input.Password
              {...field}
              autoComplete="new-password"
              prefix={<LockOutlined className="text-neutral-400" />}
              placeholder="••••••••"
              status={errors.confirmPassword ? "error" : ""}
            />
          )}
        </FormField>

        <Button type="primary" htmlType="submit" block loading={submitting}>
          {t("submit")}
        </Button>
      </form>
    </Card>
  );
}
