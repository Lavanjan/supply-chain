"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Alert, Input, InputNumber, Modal, Select } from "antd";
import { FormField } from "@/components/ui/form-field";
import { transferSchema, type TransferInput } from "@/lib/validations/inventory.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { useInventoryOptions } from "@/features/inventory/hooks/use-inventory-options";
import { useBatches } from "@/features/inventory/hooks/use-batches";
import { batchLabel } from "@/features/inventory/utils/batch-label";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_VALUES: TransferInput = {
  productId: "",
  fromWarehouseId: "",
  toWarehouseId: "",
  inventoryId: "",
  quantity: 0,
  notes: "",
};

export function TransferModal({ open, onClose, onSuccess }: TransferModalProps) {
  const { message } = App.useApp();
  const { products, warehouses, loading: optionsLoading } = useInventoryOptions();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const productId = watch("productId");
  const fromWarehouseId = watch("fromWarehouseId");
  const inventoryId = watch("inventoryId");
  const { batches, loading: batchesLoading } = useBatches(productId || undefined, fromWarehouseId || undefined);
  const selectedBatch = batches.find((batch) => batch.inventoryId === inventoryId);

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  useEffect(() => {
    setValue("inventoryId", "");
  }, [productId, fromWarehouseId, setValue]);

  async function onSubmit(values: TransferInput) {
    try {
      await apiClient.post("/api/inventory/transfer", values);
      message.success("Stock transferred");
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title="Transfer Stock"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Transfer"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="fromWarehouseId" label="From Warehouse" required>
            {(field) => (
              <Select
                {...field}
                loading={optionsLoading}
                status={errors.fromWarehouseId ? "error" : ""}
                placeholder="Source"
                options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
              />
            )}
          </FormField>

          <FormField control={control} name="toWarehouseId" label="To Warehouse" required>
            {(field) => (
              <Select
                {...field}
                loading={optionsLoading}
                status={errors.toWarehouseId ? "error" : ""}
                placeholder="Destination"
                options={warehouses
                  .filter((w) => w.id !== fromWarehouseId)
                  .map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
              />
            )}
          </FormField>
        </div>

        <FormField control={control} name="inventoryId" label="Batch" required>
          {(field) => (
            <Select
              {...field}
              loading={batchesLoading}
              disabled={!productId || !fromWarehouseId}
              status={errors.inventoryId ? "error" : ""}
              placeholder={!productId || !fromWarehouseId ? "Select product & source warehouse first" : "Select batch"}
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
