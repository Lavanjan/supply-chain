"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input, Switch } from "antd";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { categorySchema, type CategoryInput } from "@/lib/validations/category.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import type { CategoryListItem } from "@/types/category.types";

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: CategoryListItem | null;
}

const DEFAULT_VALUES: CategoryInput = { name: "", description: "", isActive: true };

export function CategoryFormModal({ open, onClose, onSuccess, category }: CategoryFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(category);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        category
          ? { name: category.name, description: category.description ?? "", isActive: category.isActive }
          : DEFAULT_VALUES,
      );
    }
  }, [open, category, reset]);

  async function onSubmit(values: CategoryInput) {
    try {
      if (isEdit && category) {
        await apiClient.patch(`/api/categories/${category.id}`, values);
        message.success("Category updated");
      } else {
        await apiClient.post("/api/categories", values);
        message.success("Category created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Category" : "New Category"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create category"}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="name" label="Category Name" required>
          {(field) => <Input {...field} status={errors.name ? "error" : ""} placeholder="e.g. Vegetables" />}
        </FormField>

        <FormField control={control} name="description" label="Description">
          {(field) => <Input.TextArea {...field} rows={3} placeholder="Optional description" />}
        </FormField>

        <FormField control={control} name="isActive" label="Active">
          {(field) => <Switch checked={field.value} onChange={field.onChange} />}
        </FormField>
      </form>
    </Modal>
  );
}
