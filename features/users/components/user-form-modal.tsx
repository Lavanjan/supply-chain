"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input, Modal, Select, Switch, Typography } from "antd";
import { FormField } from "@/components/ui/form-field";
import { userSchema, type UserInput } from "@/lib/validations/user.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { useRoleOptions } from "@/features/users/hooks/use-role-options";
import type { UserListItem } from "@/types/user.types";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserListItem | null;
}

const DEFAULT_VALUES: UserInput = { name: "", email: "", phone: "", roleId: "", isActive: true };

export function UserFormModal({ open, onClose, onSuccess, user }: UserFormModalProps) {
  const { message } = App.useApp();
  const { roles, loading: rolesLoading } = useRoleOptions();
  const isEdit = Boolean(user);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        user
          ? { name: user.name, email: user.email, phone: user.phone ?? "", roleId: user.roleId, isActive: user.isActive }
          : DEFAULT_VALUES,
      );
    }
  }, [open, user, reset]);

  async function onSubmit(values: UserInput) {
    try {
      if (isEdit && user) {
        await apiClient.patch(`/api/users/${user.id}`, values);
        message.success("User updated");
      } else {
        await apiClient.post("/api/users", values);
        message.success("User created — an invite email has been sent to set their password");
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

        <FormField control={control} name="email" label="Email" required>
          {(field) => <Input {...field} status={errors.email ? "error" : ""} placeholder="jane@company.com" />}
        </FormField>

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

        {!isEdit && (
          <Typography.Text type="secondary" className="text-xs block -mt-2">
            The new user will receive an email with a link to set their own password.
          </Typography.Text>
        )}
      </form>
    </Modal>
  );
}
