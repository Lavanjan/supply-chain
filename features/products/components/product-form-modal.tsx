"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Button, Input, InputNumber, Modal, Select } from "antd";
import { FormField } from "@/components/ui/form-field";
import { ProductImageUpload } from "@/features/products/components/product-image-upload";
import { useProductOptions } from "@/features/products/hooks/use-product-options";
import { productSchema, type ProductInput } from "@/lib/validations/product.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { generateBarcode, generateSku } from "@/lib/utils/codes";
import type { ProductListItem } from "@/types/product.types";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: ProductListItem | null;
}

const DEFAULT_VALUES: ProductInput = {
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  unitId: "",
  purchasePrice: 0,
  sellingPrice: 0,
  minimumStock: 0,
  maximumStock: 0,
  currentStock: 0,
  imageUrl: "",
  description: "",
  status: "ACTIVE",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DISCONTINUED", label: "Discontinued" },
];

export function ProductFormModal({ open, onClose, onSuccess, product }: ProductFormModalProps) {
  const { message } = App.useApp();
  const { categories, units, loading: optionsLoading } = useProductOptions();
  const isEdit = Boolean(product);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              name: product.name,
              sku: product.sku,
              barcode: product.barcode ?? "",
              categoryId: product.categoryId,
              unitId: product.unitId,
              purchasePrice: product.purchasePrice,
              sellingPrice: product.sellingPrice,
              minimumStock: product.minimumStock,
              maximumStock: product.maximumStock,
              currentStock: product.currentStock,
              imageUrl: product.imageUrl ?? "",
              description: product.description ?? "",
              status: product.status,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, product, reset]);

  async function onSubmit(values: ProductInput) {
    try {
      if (isEdit && product) {
        await apiClient.patch(`/api/products/${product.id}`, values);
        message.success("Product updated");
      } else {
        await apiClient.post("/api/products", values);
        message.success("Product created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  const imageUrl = watch("imageUrl");

  return (
    <Modal
      title={isEdit ? "Edit Product" : "New Product"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save changes" : "Create product"}
      width={720}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <ProductImageUpload value={imageUrl || undefined} onChange={(url) => setValue("imageUrl", url)} />
        </div>

        <FormField control={control} name="name" label="Product Name" required>
          {(field) => <Input {...field} status={errors.name ? "error" : ""} placeholder="e.g. Basmati Rice 25kg" />}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="sku" label="SKU" required>
            {(field) => (
              <div className="flex gap-2">
                <Input {...field} status={errors.sku ? "error" : ""} placeholder="e.g. RICE-25" />
                <Button onClick={() => setValue("sku", generateSku())}>Generate</Button>
              </div>
            )}
          </FormField>

          <FormField control={control} name="barcode" label="Barcode">
            {(field) => (
              <div className="flex gap-2">
                <Input {...field} status={errors.barcode ? "error" : ""} placeholder="Optional" />
                <Button onClick={() => setValue("barcode", generateBarcode())}>Generate</Button>
              </div>
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="categoryId" label="Category" required>
            {(field) => (
              <Select
                {...field}
                loading={optionsLoading}
                status={errors.categoryId ? "error" : ""}
                placeholder="Select category"
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
              />
            )}
          </FormField>

          <FormField control={control} name="unitId" label="Unit" required>
            {(field) => (
              <Select
                {...field}
                loading={optionsLoading}
                status={errors.unitId ? "error" : ""}
                placeholder="Select unit"
                options={units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.symbol})` }))}
              />
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="purchasePrice" label="Purchase Price" required>
            {(field) => (
              <InputNumber
                {...field}
                min={0}
                precision={2}
                prefix="$"
                className="w-full"
                status={errors.purchasePrice ? "error" : ""}
              />
            )}
          </FormField>

          <FormField control={control} name="sellingPrice" label="Selling Price" required>
            {(field) => (
              <InputNumber
                {...field}
                min={0}
                precision={2}
                prefix="$"
                className="w-full"
                status={errors.sellingPrice ? "error" : ""}
              />
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="minimumStock" label="Minimum Stock" required>
            {(field) => <InputNumber {...field} min={0} className="w-full" status={errors.minimumStock ? "error" : ""} />}
          </FormField>

          <FormField control={control} name="maximumStock" label="Maximum Stock" required>
            {(field) => <InputNumber {...field} min={0} className="w-full" status={errors.maximumStock ? "error" : ""} />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="currentStock" label="Current Stock" required>
            {(field) => <InputNumber {...field} min={0} className="w-full" status={errors.currentStock ? "error" : ""} />}
          </FormField>

          <FormField control={control} name="status" label="Status" required>
            {(field) => <Select {...field} options={STATUS_OPTIONS} />}
          </FormField>
        </div>

        <FormField control={control} name="description" label="Description">
          {(field) => <Input.TextArea {...field} rows={3} placeholder="Optional description" />}
        </FormField>
      </form>
    </Modal>
  );
}
