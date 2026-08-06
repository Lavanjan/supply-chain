"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Alert, Input, InputNumber, Select } from "antd";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { stockOutSchema, type StockOutInput } from "@/lib/validations/inventory.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { useInventoryOptions } from "@/features/inventory/hooks/use-inventory-options";
import { useBatches } from "@/features/inventory/hooks/use-batches";
import { batchLabel } from "@/features/inventory/utils/batch-label";

interface StockOutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_VALUES: StockOutInput = {
  productId: "",
  warehouseId: "",
  inventoryId: "",
  quantity: 0,
  notes: "",
};

export function StockOutModal({ open, onClose, onSuccess }: StockOutModalProps) {
  const { message } = App.useApp();
  const { products, warehouses, loading: optionsLoading } = useInventoryOptions();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StockOutInput>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const productId = watch("productId");
  const warehouseId = watch("warehouseId");
  const inventoryId = watch("inventoryId");
  const { batches, loading: batchesLoading } = useBatches(productId || undefined, warehouseId || undefined);
  const selectedBatch = batches.find((batch) => batch.inventoryId === inventoryId);

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  useEffect(() => {
    setValue("inventoryId", "");
  }, [productId, warehouseId, setValue]);

  async function onSubmit(values: StockOutInput) {
    try {
      await apiClient.post("/api/inventory/stock-out", values);
      message.success("Stock removed");
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title="Stock Out"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Remove Stock"
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

        <FormField control={control} name="inventoryId" label="Batch" required>
          {(field) => (
            <Select
              {...field}
              loading={batchesLoading}
              disabled={!productId || !warehouseId}
              status={errors.inventoryId ? "error" : ""}
              placeholder={!productId || !warehouseId ? "Select product & warehouse first" : "Select batch"}
              options={batches.map((batch) => ({ value: batch.inventoryId, label: batchLabel(batch) }))}
              notFoundContent={!batchesLoading && "No stock available here"}
            />
          )}
        </FormField>

        <FormField control={control} name="quantity" label="Quantity" required>
          {(field) => (
            <InputNumber
              {...field}
              min={0.01}
              max={selectedBatch?.quantity}
              className="w-full"
              status={errors.quantity ? "error" : ""}
            />
          )}
        </FormField>

        {selectedBatch && (
          <Alert
            type="info"
            showIcon
            className="mb-3"
            message={`${selectedBatch.quantity} currently available in this batch`}
          />
        )}

        <FormField control={control} name="notes" label="Notes">
          {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional notes" />}
        </FormField>
      </form>
    </Modal>
  );
}
