"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input } from "antd";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { resetUserPasswordSchema, type ResetUserPasswordInput } from "@/lib/validations/user.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import type { UserListItem } from "@/types/user.types";

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  user: UserListItem | null;
}

const DEFAULT_VALUES: ResetUserPasswordInput = { password: "", confirmPassword: "" };

export function ResetPasswordModal({ open, onClose, user }: ResetPasswordModalProps) {
  const { message } = App.useApp();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetUserPasswordInput>({
    resolver: zodResolver(resetUserPasswordSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  async function onSubmit(values: ResetUserPasswordInput) {
    if (!user) return;
    try {
      await apiClient.post(`/api/users/${user.id}/reset-password`, values);
      message.success(`Password reset for ${user.name}`);
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={user ? `Reset Password — ${user.name}` : "Reset Password"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Reset password"
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="password" label="New Password" required>
          {(field) => (
            <Input.Password
              {...field}
              status={errors.password ? "error" : ""}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          )}
        </FormField>

        <FormField control={control} name="confirmPassword" label="Confirm Password" required>
          {(field) => (
            <Input.Password
              {...field}
              status={errors.confirmPassword ? "error" : ""}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
