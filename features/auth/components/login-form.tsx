"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Button, Card, Checkbox, Input, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { FormField } from "@/components/ui/form-field";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/constants/routes";
import { resolveLoginErrorMessage } from "@/features/auth/constants/error-messages";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const urlErrorMessage = resolveLoginErrorMessage(searchParams.get("code"));

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        remember: String(values.remember),
        redirect: false,
      });

      if (result?.error) {
        message.error(resolveLoginErrorMessage(result.code) ?? "Unable to sign in.");
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_LOGIN_REDIRECT;
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg rounded-2xl" styles={{ body: { padding: "2rem" } }}>
      <div className="mb-6 text-center">
        <Typography.Title level={3} className="!mb-1">
          Welcome back
        </Typography.Title>
        <Typography.Text type="secondary">
          Sign in to your Supply Chain & Inventory account
        </Typography.Text>
      </div>

      {urlErrorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
        >
          {urlErrorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="email" label="Email" required>
          {(field) => (
            <Input
              {...field}
              size="large"
              type="email"
              autoComplete="email"
              prefix={<MailOutlined className="text-neutral-400" />}
              placeholder="you@company.com"
              status={errors.email ? "error" : ""}
            />
          )}
        </FormField>

        <FormField control={control} name="password" label="Password" required>
          {(field) => (
            <Input.Password
              {...field}
              size="large"
              autoComplete="current-password"
              prefix={<LockOutlined className="text-neutral-400" />}
              placeholder="••••••••"
              status={errors.password ? "error" : ""}
            />
          )}
        </FormField>

        <div className="mb-6 flex items-center justify-between">
          <FormField control={control} name="remember" className="!mb-0">
            {(field) => (
              <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                Remember me
              </Checkbox>
            )}
          </FormField>
          <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={submitting}
          className="!h-11"
        >
          Sign In
        </Button>
      </form>
    </Card>
  );
}
