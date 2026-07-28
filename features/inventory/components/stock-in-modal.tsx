"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, DatePicker, Input, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import { FormField } from "@/components/ui/form-field";
import { stockInSchema, type StockInInput } from "@/lib/validations/inventory.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { useInventoryOptions } from "@/features/inventory/hooks/use-inventory-options";

interface StockInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_VALUES: StockInInput = {
  productId: "",
  warehouseId: "",
  quantity: 0,
  batchNumber: "",
  expiryDate: "",
  notes: "",
};

export function StockInModal({ open, onClose, onSuccess }: StockInModalProps) {
  const { message } = App.useApp();
  const { products, warehouses, loading: optionsLoading } = useInventoryOptions();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StockInInput>({
    resolver: zodResolver(stockInSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  async function onSubmit(values: StockInInput) {
    try {
      await apiClient.post("/api/inventory/stock-in", values);
      message.success("Stock added");
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title="Stock In"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Add Stock"
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField control={control} name="productId" label="Product" required>
          {(field) => (
            <Select
              {...field}
              showSearch
              loading={optionsLoading}
              status={errors.productId ? "error" : ""}
              placeholder="Select product"
              optionFilterProp="label"
              options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            />
          )}
        </FormField>

        <FormField control={control} name="warehouseId" label="Warehouse" required>
          {(field) => (
            <Select
              {...field}
              loading={optionsLoading}
              status={errors.warehouseId ? "error" : ""}
              placeholder="Select warehouse"
              options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="quantity" label="Quantity" required>
            {(field) => <InputNumber {...field} min={0.01} className="w-full" status={errors.quantity ? "error" : ""} />}
          </FormField>

          <FormField control={control} name="batchNumber" label="Batch Number">
            {(field) => <Input {...field} placeholder="Optional" />}
          </FormField>
        </div>

        <FormField control={control} name="expiryDate" label="Expiry Date">
          {(field) => (
            <DatePicker
              className="w-full"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) => setValue("expiryDate", date ? date.toISOString() : "")}
            />
          )}
        </FormField>

        <FormField control={control} name="notes" label="Notes">
          {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional notes" />}
        </FormField>
      </form>
    </Modal>
  );
}
