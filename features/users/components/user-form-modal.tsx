"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { App, Input, Select, Switch, Typography } from "antd";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { passwordRuleSchema } from "@/lib/validations/auth.schema";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/user.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { useRoleOptions } from "@/features/users/hooks/use-role-options";
import type { UserListItem } from "@/types/user.types";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserListItem | null;
}

const DEFAULT_VALUES: CreateUserInput = {
  name: "",
  username: "",
  phone: "",
  roleId: "",
  isActive: true,
  password: "",
};

export function UserFormModal({ open, onClose, onSuccess, user }: UserFormModalProps) {
  const { message } = App.useApp();
  const { roles, loading: rolesLoading } = useRoleOptions();
  const isEdit = Boolean(user);

  // Password is only required (and validated) on create — the field itself is hidden in
  // edit mode — but the form's value type must stay identical across both modes, so the
  // requirement is applied via superRefine rather than swapping to a differently-shaped schema.
  const formSchema = useMemo(
    () =>
      createUserSchema.omit({ password: true }).extend({ password: z.string() }).superRefine((data, ctx) => {
        if (isEdit) return;
        const result = passwordRuleSchema.safeParse(data.password);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({ ...issue, path: ["password"] });
          }
        }
      }),
    [isEdit],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        user
          ? {
              name: user.name,
              username: user.username,
              phone: user.phone ?? "",
              roleId: user.roleId,
              isActive: user.isActive,
              password: "",
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, user, reset]);

  async function onSubmit(values: CreateUserInput) {
    try {
      if (isEdit && user) {
        const { password: _password, ...updateValues } = values;
        await apiClient.patch(`/api/users/${user.id}`, updateValues);
        message.success("User updated");
      } else {
        await apiClient.post("/api/users", values);
        message.success("User created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit User" : "New User"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create user"}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="name" label="Full Name" required>
          {(field) => <Input {...field} status={errors.name ? "error" : ""} placeholder="e.g. Jane Doe" />}
        </FormField>

        <FormField control={control} name="username" label="Username" required>
          {(field) => (
            <Input {...field} status={errors.username ? "error" : ""} placeholder="e.g. jane.doe" autoComplete="off" />
          )}
        </FormField>

        {!isEdit && (
          <FormField control={control} name="password" label="Password" required>
            {(field) => (
              <Input.Password
                {...field}
                status={errors.password ? "error" : ""}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            )}
          </FormField>
        )}

        <FormField control={control} name="phone" label="Phone">
          {(field) => <Input {...field} placeholder="Optional" />}
        </FormField>

        <FormField control={control} name="roleId" label="Role" required>
          {(field) => (
            <Select
              {...field}
              loading={rolesLoading}
              status={errors.roleId ? "error" : ""}
              placeholder="Select role"
              options={roles.map((role) => ({ value: role.id, label: role.name === "ADMIN" ? "Admin" : "Manager" }))}
            />
          )}
        </FormField>

        <FormField control={control} name="isActive" label="Active">
          {(field) => (
            <div className="flex items-center gap-2">
              <Switch checked={field.value} onChange={field.onChange} />
              <Typography.Text type="secondary" className="text-sm">
                {field.value ? "User can sign in" : "User is blocked from signing in"}
              </Typography.Text>
            </div>
          )}
        </FormField>
      </form>
    </Modal>
  );
}
