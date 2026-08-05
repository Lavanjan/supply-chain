"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Button, Input, InputNumber, Modal, Select } from "antd";
import { useTranslations } from "next-intl";
import { FormField } from "@/components/ui/form-field";
import { ProductImageUpload } from "@/features/products/components/product-image-upload";
import { useProductOptions } from "@/features/products/hooks/use-product-options";
import { productSchema, type ProductInput } from "@/lib/validations/product.schema";
import { apiClient } from "@/lib/api/client";
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

export function ProductFormModal({ open, onClose, onSuccess, product }: ProductFormModalProps) {
  const { message } = App.useApp();
  const { categories, units, loading: optionsLoading } = useProductOptions();
  const isEdit = Boolean(product);
  const t = useTranslations("products.form");
  const tStatus = useTranslations("products.status");

  const STATUS_OPTIONS = [
    { value: "ACTIVE", label: tStatus("ACTIVE") },
    { value: "INACTIVE", label: tStatus("INACTIVE") },
    { value: "DISCONTINUED", label: tStatus("DISCONTINUED") },
  ];

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

  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setPendingImageFile(null);
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

  async function uploadPendingImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/products/upload", { method: "POST", body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: t("uploadFailed") }));
      throw new Error(body.error ?? t("uploadFailed"));
    }
    const data = await response.json();
    return data.url;
  }

  async function onSubmit(values: ProductInput) {
    try {
      const imageUrl = pendingImageFile ? await uploadPendingImage(pendingImageFile) : values.imageUrl;
      const payload = { ...values, imageUrl };

      if (isEdit && product) {
        await apiClient.patch(`/api/products/${product.id}`, payload);
        message.success(t("updated"));
      } else {
        await apiClient.post("/api/products", payload);
        message.success(t("created"));
      }
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof Error ? error.message : t("genericError"));
    }
  }

  const imageUrl = watch("imageUrl");

  return (
    <Modal
      title={isEdit ? t("editTitle") : t("createTitle")}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? t("saveChanges") : t("createProduct")}
      width={720}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <ProductImageUpload value={imageUrl || undefined} onFileSelect={setPendingImageFile} />
        </div>

        <FormField control={control} name="name" label={t("nameLabel")} required>
          {(field) => <Input {...field} status={errors.name ? "error" : ""} placeholder={t("namePlaceholder")} />}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="sku" label={t("skuLabel")} required>
            {(field) => (
              <div className="flex gap-2">
                <Input {...field} status={errors.sku ? "error" : ""} placeholder={t("skuPlaceholder")} />
                <Button onClick={() => setValue("sku", generateSku())}>{t("generate")}</Button>
              </div>
            )}
          </FormField>

          <FormField control={control} name="barcode" label={t("barcodeLabel")}>
            {(field) => (
              <div className="flex gap-2">
                <Input {...field} status={errors.barcode ? "error" : ""} placeholder={t("optional")} />
                <Button onClick={() => setValue("barcode", generateBarcode())}>{t("generate")}</Button>
              </div>
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="categoryId" label={t("categoryLabel")} required>
            {(field) => (
              <Select
                {...field}
                loading={optionsLoading}
                status={errors.categoryId ? "error" : ""}
                placeholder={t("categoryPlaceholder")}
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
              />
            )}
          </FormField>

          <FormField control={control} name="unitId" label={t("unitLabel")} required>
            {(field) => (
              <Select
                {...field}
                loading={optionsLoading}
                status={errors.unitId ? "error" : ""}
                placeholder={t("unitPlaceholder")}
                options={units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.symbol})` }))}
              />
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="purchasePrice" label={t("purchasePriceLabel")} required>
            {(field) => (
              <InputNumber
                {...field}
                min={0}
                precision={2}
                prefix="LKR"
                className="w-full"
                status={errors.purchasePrice ? "error" : ""}
              />
            )}
          </FormField>

          <FormField control={control} name="sellingPrice" label={t("sellingPriceLabel")} required>
            {(field) => (
              <InputNumber
                {...field}
                min={0}
                precision={2}
                prefix="LKR"
                className="w-full"
                status={errors.sellingPrice ? "error" : ""}
              />
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="minimumStock" label={t("minimumStockLabel")} required>
            {(field) => <InputNumber {...field} min={0} className="w-full" status={errors.minimumStock ? "error" : ""} />}
          </FormField>

          <FormField control={control} name="maximumStock" label={t("maximumStockLabel")} required>
            {(field) => <InputNumber {...field} min={0} className="w-full" status={errors.maximumStock ? "error" : ""} />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="currentStock" label={t("currentStockLabel")} required>
            {(field) => <InputNumber {...field} min={0} className="w-full" status={errors.currentStock ? "error" : ""} />}
          </FormField>

          <FormField control={control} name="status" label={t("statusLabel")} required>
            {(field) => <Select {...field} options={STATUS_OPTIONS} />}
          </FormField>
        </div>

        <FormField control={control} name="description" label={t("descriptionLabel")}>
          {(field) => <Input.TextArea {...field} rows={3} placeholder={t("descriptionPlaceholder")} />}
        </FormField>
      </form>
    </Modal>
  );
}
