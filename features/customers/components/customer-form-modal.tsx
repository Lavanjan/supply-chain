"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Input, Select } from "antd";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { customerSchema, type CustomerInput } from "@/lib/validations/customer.schema";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants/customer";
import { apiClient, ApiError } from "@/lib/api/client";
import type { CustomerListItem } from "@/types/customer.types";

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: CustomerListItem | null;
}

const DEFAULT_VALUES: CustomerInput = {
  companyName: "",
  customerType: "COMPANY",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  status: "ACTIVE",
};

const TYPE_OPTIONS = Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function CustomerFormModal({ open, onClose, onSuccess, customer }: CustomerFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(customer);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        customer
          ? {
              companyName: customer.companyName,
              customerType: customer.customerType,
              contactPerson: customer.contactPerson ?? "",
              phone: customer.phone,
              email: customer.email ?? "",
              address: customer.address ?? "",
              status: customer.status,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, customer, reset]);

  async function onSubmit(values: CustomerInput) {
    try {
      if (isEdit && customer) {
        await apiClient.patch(`/api/customers/${customer.id}`, values);
        message.success("Customer updated");
      } else {
        await apiClient.post("/api/customers", values);
        message.success("Customer created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Customer" : "New Customer"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create customer"}
      width={640}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="companyName" label="Company" required>
            {(field) => <Input {...field} status={errors.companyName ? "error" : ""} placeholder="e.g. City General Hospital" />}
          </FormField>

          <FormField control={control} name="customerType" label="Customer Type" required>
            {(field) => <Select {...field} options={TYPE_OPTIONS} />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="contactPerson" label="Contact Person">
            {(field) => <Input {...field} placeholder="Optional" />}
          </FormField>

          <FormField control={control} name="phone" label="Phone" required>
            {(field) => <Input {...field} status={errors.phone ? "error" : ""} placeholder="+1-555-0100" />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="email" label="Email">
            {(field) => <Input {...field} status={errors.email ? "error" : ""} placeholder="Optional" />}
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
        </div>

        <FormField control={control} name="address" label="Address">
          {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional address" />}
        </FormField>
      </form>
    </Modal>
  );
}
