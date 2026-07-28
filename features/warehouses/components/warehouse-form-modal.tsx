"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input, Modal, Switch } from "antd";
import { FormField } from "@/components/ui/form-field";
import { warehouseSchema, type WarehouseInput } from "@/lib/validations/warehouse.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import type { WarehouseListItem } from "@/types/warehouse.types";

interface WarehouseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouse?: WarehouseListItem | null;
}

const DEFAULT_VALUES: WarehouseInput = {
  name: "",
  code: "",
  address: "",
  managerName: "",
  phone: "",
  isActive: true,
};

export function WarehouseFormModal({ open, onClose, onSuccess, warehouse }: WarehouseFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(warehouse);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        warehouse
          ? {
              name: warehouse.name,
              code: warehouse.code,
              address: warehouse.address ?? "",
              managerName: warehouse.managerName ?? "",
              phone: warehouse.phone ?? "",
              isActive: warehouse.isActive,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, warehouse, reset]);

  async function onSubmit(values: WarehouseInput) {
    try {
      if (isEdit && warehouse) {
        await apiClient.patch(`/api/warehouses/${warehouse.id}`, values);
        message.success("Warehouse updated");
      } else {
        await apiClient.post("/api/warehouses", values);
        message.success("Warehouse created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Warehouse" : "New Warehouse"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create warehouse"}
      width={640}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="name" label="Warehouse Name" required>
            {(field) => <Input {...field} status={errors.name ? "error" : ""} placeholder="e.g. Central Warehouse" />}
          </FormField>

          <FormField control={control} name="code" label="Code" required>
            {(field) => <Input {...field} status={errors.code ? "error" : ""} placeholder="e.g. WH-001" />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="managerName" label="Manager Name">
            {(field) => <Input {...field} placeholder="Optional" />}
          </FormField>

          <FormField control={control} name="phone" label="Phone">
            {(field) => <Input {...field} placeholder="Optional" />}
          </FormField>
        </div>

        <FormField control={control} name="address" label="Address">
          {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional address" />}
        </FormField>

        <FormField control={control} name="isActive" label="Active">
          {(field) => <Switch checked={field.value} onChange={field.onChange} />}
        </FormField>
      </form>
    </Modal>
  );
}
