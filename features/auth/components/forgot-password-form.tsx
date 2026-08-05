"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { FormField } from "@/components/ui/form-field";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth.schema";
import { forgotPasswordAction } from "@/features/auth/actions/forgot-password.action";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const t = useTranslations("auth.forgotPassword");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true);
    try {
      const response = await forgotPasswordAction(values);
      setResult(response);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg rounded-2xl" styles={{ body: { padding: "2rem" } }}>
      <div className="mb-6 text-center">
        <Typography.Title level={3} className="!mb-1">
          {t("title")}
        </Typography.Title>
        <Typography.Text type="secondary">{t("subtitle")}</Typography.Text>
      </div>

      {result ? (
        <div
          role="status"
          className={`rounded-lg border px-3 py-3 text-sm ${
            result.success
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400"
              : "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {result.message}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField control={control} name="email" label={t("emailLabel")} required>
            {(field) => (
              <Input
                {...field}
                type="email"
                autoComplete="email"
                prefix={<MailOutlined className="text-neutral-400" />}
                placeholder={t("emailPlaceholder")}
                status={errors.email ? "error" : ""}
              />
            )}
          </FormField>

          <Button type="primary" htmlType="submit" block loading={submitting}>
            {t("submit")}
          </Button>
        </form>
      )}

      <div className="mt-4 text-center text-sm">
        <a href="/login" className="text-blue-600 hover:underline">
          {t("backToSignIn")}
        </a>
      </div>
    </Card>
  );
}
