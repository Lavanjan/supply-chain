"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input, Modal, Select } from "antd";
import { FormField } from "@/components/ui/form-field";
import { vehicleSchema, type VehicleInput } from "@/lib/validations/vehicle.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import type { VehicleListItem } from "@/types/vehicle.types";

interface VehicleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle?: VehicleListItem | null;
}

const DEFAULT_VALUES: VehicleInput = { plateNumber: "", type: "", capacity: "", status: "ACTIVE" };

export function VehicleFormModal({ open, onClose, onSuccess, vehicle }: VehicleFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(vehicle);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        vehicle
          ? { plateNumber: vehicle.plateNumber, type: vehicle.type, capacity: vehicle.capacity ?? "", status: vehicle.status }
          : DEFAULT_VALUES,
      );
    }
  }, [open, vehicle, reset]);

  async function onSubmit(values: VehicleInput) {
    try {
      if (isEdit && vehicle) {
        await apiClient.patch(`/api/vehicles/${vehicle.id}`, values);
        message.success("Vehicle updated");
      } else {
        await apiClient.post("/api/vehicles", values);
        message.success("Vehicle created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Vehicle" : "New Vehicle"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create vehicle"}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="plateNumber" label="Plate Number" required>
            {(field) => <Input {...field} status={errors.plateNumber ? "error" : ""} placeholder="e.g. ABC-1234" />}
          </FormField>

          <FormField control={control} name="type" label="Type" required>
            {(field) => <Input {...field} status={errors.type ? "error" : ""} placeholder="e.g. Refrigerated Truck" />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="capacity" label="Capacity">
            {(field) => <Input {...field} placeholder="e.g. 5 tons" />}
          </FormField>

          <FormField control={control} name="status" label="Status" required>
            {(field) => (
              <Select
                {...field}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "MAINTENANCE", label: "Maintenance" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
              />
            )}
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
