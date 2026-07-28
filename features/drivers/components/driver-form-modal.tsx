"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input, Modal, Select } from "antd";
import { FormField } from "@/components/ui/form-field";
import { driverSchema, type DriverInput } from "@/lib/validations/driver.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import type { DriverListItem } from "@/types/driver.types";

interface DriverFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver?: DriverListItem | null;
}

const DEFAULT_VALUES: DriverInput = { name: "", licenseNumber: "", phone: "", status: "ACTIVE" };

export function DriverFormModal({ open, onClose, onSuccess, driver }: DriverFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(driver);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverInput>({
    resolver: zodResolver(driverSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        driver
          ? { name: driver.name, licenseNumber: driver.licenseNumber, phone: driver.phone, status: driver.status }
          : DEFAULT_VALUES,
      );
    }
  }, [open, driver, reset]);

  async function onSubmit(values: DriverInput) {
    try {
      if (isEdit && driver) {
        await apiClient.patch(`/api/drivers/${driver.id}`, values);
        message.success("Driver updated");
      } else {
        await apiClient.post("/api/drivers", values);
        message.success("Driver created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Driver" : "New Driver"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create driver"}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="name" label="Full Name" required>
          {(field) => <Input {...field} status={errors.name ? "error" : ""} placeholder="e.g. John Smith" />}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="licenseNumber" label="License Number" required>
            {(field) => <Input {...field} status={errors.licenseNumber ? "error" : ""} placeholder="e.g. DL-123456" />}
          </FormField>

          <FormField control={control} name="phone" label="Phone" required>
            {(field) => <Input {...field} status={errors.phone ? "error" : ""} placeholder="+1-555-0100" />}
          </FormField>
        </div>

        <FormField control={control} name="status" label="Status" required>
          {(field) => (
            <Select
              {...field}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
