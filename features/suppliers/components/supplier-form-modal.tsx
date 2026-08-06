"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Divider, Input, Select, Typography } from "antd";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { supplierSchema, type SupplierInput } from "@/lib/validations/supplier.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import type { SupplierListItem } from "@/types/supplier.types";

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: SupplierListItem | null;
}

const DEFAULT_VALUES: SupplierInput = {
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankBranch: "",
  status: "ACTIVE",
};

export function SupplierFormModal({ open, onClose, onSuccess, supplier }: SupplierFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(supplier);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        supplier
          ? {
              companyName: supplier.companyName,
              contactPerson: supplier.contactPerson,
              phone: supplier.phone,
              email: supplier.email ?? "",
              address: supplier.address ?? "",
              bankName: supplier.bankName ?? "",
              bankAccountName: supplier.bankAccountName ?? "",
              bankAccountNumber: supplier.bankAccountNumber ?? "",
              bankBranch: supplier.bankBranch ?? "",
              status: supplier.status,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, supplier, reset]);

  async function onSubmit(values: SupplierInput) {
    try {
      if (isEdit && supplier) {
        await apiClient.patch(`/api/suppliers/${supplier.id}`, values);
        message.success("Supplier updated");
      } else {
        await apiClient.post("/api/suppliers", values);
        message.success("Supplier created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Supplier" : "New Supplier"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create supplier"}
      width={640}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="companyName" label="Company" required>
            {(field) => <Input {...field} status={errors.companyName ? "error" : ""} placeholder="e.g. Fresh Farms Ltd" />}
          </FormField>

          <FormField control={control} name="contactPerson" label="Contact Person" required>
            {(field) => <Input {...field} status={errors.contactPerson ? "error" : ""} placeholder="e.g. Jane Doe" />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="phone" label="Phone" required>
            {(field) => <Input {...field} status={errors.phone ? "error" : ""} placeholder="+1-555-0100" />}
          </FormField>

          <FormField control={control} name="email" label="Email">
            {(field) => <Input {...field} status={errors.email ? "error" : ""} placeholder="contact@supplier.com" />}
          </FormField>
        </div>

        <FormField control={control} name="address" label="Address">
          {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional address" />}
        </FormField>

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

        <Divider orientation="left" className="!my-3">
          <Typography.Text type="secondary" className="text-xs">
            Bank Details
          </Typography.Text>
        </Divider>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="bankName" label="Bank Name">
            {(field) => <Input {...field} placeholder="Optional" />}
          </FormField>

          <FormField control={control} name="bankBranch" label="Branch">
            {(field) => <Input {...field} placeholder="Optional" />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="bankAccountName" label="Account Name">
            {(field) => <Input {...field} placeholder="Optional" />}
          </FormField>

          <FormField control={control} name="bankAccountNumber" label="Account Number">
            {(field) => <Input {...field} placeholder="Optional" />}
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
