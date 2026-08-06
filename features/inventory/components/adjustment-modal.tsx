"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Alert, Input, InputNumber, Select } from "antd";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { adjustmentSchema, type AdjustmentInput } from "@/lib/validations/inventory.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { useInventoryOptions } from "@/features/inventory/hooks/use-inventory-options";
import { useBatches } from "@/features/inventory/hooks/use-batches";
import { batchLabel } from "@/features/inventory/utils/batch-label";

interface AdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_VALUES: AdjustmentInput = {
  productId: "",
  warehouseId: "",
  inventoryId: "",
  newQuantity: 0,
  notes: "",
};

export function AdjustmentModal({ open, onClose, onSuccess }: AdjustmentModalProps) {
  const { message } = App.useApp();
  const { products, warehouses, loading: optionsLoading } = useInventoryOptions();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema),
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

  async function onSubmit(values: AdjustmentInput) {
    try {
      await apiClient.post("/api/inventory/adjust", values);
      message.success("Inventory adjusted");
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title="Stock Adjustment"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Apply Adjustment"
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

        {selectedBatch && (
          <Alert type="info" showIcon className="mb-3" message={`Current quantity: ${selectedBatch.quantity}`} />
        )}

        <FormField control={control} name="newQuantity" label="New Quantity" required>
          {(field) => <InputNumber {...field} min={0} className="w-full" status={errors.newQuantity ? "error" : ""} />}
        </FormField>

        <FormField control={control} name="notes" label="Reason" required>
          {(field) => (
            <Input.TextArea {...field} rows={2} status={errors.notes ? "error" : ""} placeholder="e.g. Physical count correction" />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
