"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { FormField } from "@/components/ui/form-field";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth.schema";
import { resetPasswordAction } from "@/features/auth/actions/reset-password.action";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          Invalid link
        </Typography.Title>
        <Typography.Text type="secondary">
          This password reset link is missing its token. Please request a new one.
        </Typography.Text>
        <div className="mt-4">
          <a href="/forgot-password" className="text-blue-600 hover:underline">
            Request a new link
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl" styles={{ body: { padding: "2rem" } }}>
      <div className="mb-6 text-center">
        <Typography.Title level={3} className="!mb-1">
          Reset your password
        </Typography.Title>
        <Typography.Text type="secondary">Choose a new password for your account</Typography.Text>
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
        <FormField control={control} name="password" label="New password" required>
          {(field) => (
            <Input.Password
              {...field}
              size="large"
              autoComplete="new-password"
              prefix={<LockOutlined className="text-neutral-400" />}
              placeholder="••••••••"
              status={errors.password ? "error" : ""}
            />
          )}
        </FormField>

        <FormField control={control} name="confirmPassword" label="Confirm password" required>
          {(field) => (
            <Input.Password
              {...field}
              size="large"
              autoComplete="new-password"
              prefix={<LockOutlined className="text-neutral-400" />}
              placeholder="••••••••"
              status={errors.confirmPassword ? "error" : ""}
            />
          )}
        </FormField>

        <Button type="primary" htmlType="submit" size="large" block loading={submitting} className="!h-11">
          Reset password
        </Button>
      </form>
    </Card>
  );
}
