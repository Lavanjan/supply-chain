"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input, Modal, Switch } from "antd";
import { FormField } from "@/components/ui/form-field";
import { unitSchema, type UnitInput } from "@/lib/validations/unit.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import type { UnitListItem } from "@/types/unit.types";

interface UnitFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unit?: UnitListItem | null;
}

const DEFAULT_VALUES: UnitInput = { name: "", symbol: "", isActive: true };

export function UnitFormModal({ open, onClose, onSuccess, unit }: UnitFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(unit);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(unit ? { name: unit.name, symbol: unit.symbol, isActive: unit.isActive } : DEFAULT_VALUES);
    }
  }, [open, unit, reset]);

  async function onSubmit(values: UnitInput) {
    try {
      if (isEdit && unit) {
        await apiClient.patch(`/api/units/${unit.id}`, values);
        message.success("Unit updated");
      } else {
        await apiClient.post("/api/units", values);
        message.success("Unit created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Unit" : "New Unit"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create unit"}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="name" label="Unit Name" required>
          {(field) => <Input {...field} status={errors.name ? "error" : ""} placeholder="e.g. Kilogram" />}
        </FormField>

        <FormField control={control} name="symbol" label="Symbol" required>
          {(field) => <Input {...field} status={errors.symbol ? "error" : ""} placeholder="e.g. kg" />}
        </FormField>

        <FormField control={control} name="isActive" label="Active">
          {(field) => <Switch checked={field.value} onChange={field.onChange} />}
        </FormField>
      </form>
    </Modal>
  );
}
