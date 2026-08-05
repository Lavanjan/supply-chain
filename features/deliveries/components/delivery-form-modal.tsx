"use client";

import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Button, Card, DatePicker, Input, InputNumber, Modal, Select, Table, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { FormField } from "@/components/ui/form-field";
import { deliverySchema, type DeliveryInput } from "@/lib/validations/delivery.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatNumber } from "@/lib/utils/format";
import { useDeliveryOptions } from "@/features/deliveries/hooks/use-delivery-options";
import type { DeliveryDetail } from "@/types/delivery.types";
import type { InventoryBatchOption } from "@/types/inventory.types";

interface DeliveryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreated?: (id: string) => void;
  delivery?: DeliveryDetail | null;
}

const EMPTY_ITEM = { productId: "", quantity: 1 };

function defaultValuesFrom(delivery?: DeliveryDetail | null): DeliveryInput {
  if (!delivery) {
    return {
      customerId: "",
      warehouseId: "",
      vehicleId: "",
      driverId: "",
      scheduledDate: dayjs().toISOString(),
      deliveryAddress: "",
      notes: "",
      items: [EMPTY_ITEM],
    };
  }
  return {
    customerId: delivery.customerId,
    warehouseId: delivery.warehouseId,
    vehicleId: delivery.vehicleId ?? "",
    driverId: delivery.driverId ?? "",
    scheduledDate: delivery.scheduledDate,
    deliveryAddress: delivery.deliveryAddress ?? "",
    notes: delivery.notes ?? "",
    items: delivery.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
  };
}

export function DeliveryFormModal({ open, onClose, onSuccess, onCreated, delivery }: DeliveryFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(delivery);
  const { customers, warehouses, vehicles, drivers, products, loading: optionsLoading } = useDeliveryOptions();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryInput>({
    resolver: zodResolver(deliverySchema),
    defaultValues: defaultValuesFrom(delivery),
  });

  useEffect(() => {
    if (open) {
      reset(defaultValuesFrom(delivery));
    }
  }, [open, delivery, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const warehouseId = watch("warehouseId");

  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>({});
  const [stockLoading, setStockLoading] = useState<Record<string, boolean>>({});

  const loadAvailableStock = useCallback(async (productId: string, forWarehouseId: string) => {
    if (!productId || !forWarehouseId) return;
    setStockLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const batches = await apiClient.get<InventoryBatchOption[]>("/api/inventory/batches", {
        productId,
        warehouseId: forWarehouseId,
      });
      const total = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      setStockByProduct((prev) => ({ ...prev, [productId]: total }));
    } catch {
      // Stock lookup is a UX aid only — the server re-validates on submit regardless.
    } finally {
      setStockLoading((prev) => ({ ...prev, [productId]: false }));
    }
  }, []);

  useEffect(() => {
    setStockByProduct({});
    if (!warehouseId) return;
    const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];
    productIds.forEach((productId) => loadAvailableStock(productId, warehouseId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  async function onSubmit(values: DeliveryInput) {
    const requestedByProduct = new Map<string, number>();
    for (const item of values.items) {
      requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) ?? 0) + item.quantity);
    }
    for (const [productId, requested] of requestedByProduct) {
      const available = stockByProduct[productId];
      if (available !== undefined && requested > available) {
        const product = products.find((p) => p.id === productId);
        message.error(`${product?.name ?? "Selected product"} exceeds available stock (${formatNumber(available)}).`);
        return;
      }
    }

    try {
      if (isEdit && delivery) {
        await apiClient.patch(`/api/deliveries/${delivery.id}`, values);
        message.success("Delivery updated");
        onSuccess?.();
        onClose();
      } else {
        const created = await apiClient.post<{ id: string }>("/api/deliveries", values);
        message.success("Delivery scheduled");
        onSuccess?.();
        onClose();
        onCreated?.(created.id);
      }
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Delivery" : "New Delivery"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save Changes" : "Schedule Delivery"}
      width={800}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Card title="Delivery Details" className="rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField control={control} name="customerId" label="Customer" required>
              {(field) => (
                <Select
                  {...field}
                  showSearch
                  loading={optionsLoading}
                  status={errors.customerId ? "error" : ""}
                  placeholder="Select customer"
                  optionFilterProp="label"
                  onChange={(value) => {
                    field.onChange(value);
                    const customer = customers.find((c) => c.id === value);
                    if (customer?.address) setValue("deliveryAddress", customer.address);
                  }}
                  options={customers.map((c) => ({ value: c.id, label: c.companyName }))}
                />
              )}
            </FormField>

            <FormField control={control} name="warehouseId" label="Ship From Warehouse" required>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField control={control} name="vehicleId" label="Vehicle">
              {(field) => (
                <Select
                  {...field}
                  allowClear
                  loading={optionsLoading}
                  placeholder="Assign a vehicle (optional)"
                  options={vehicles.map((v) => ({ value: v.id, label: `${v.plateNumber} (${v.type})` }))}
                />
              )}
            </FormField>

            <FormField control={control} name="driverId" label="Driver">
              {(field) => (
                <Select
                  {...field}
                  allowClear
                  loading={optionsLoading}
                  placeholder="Assign a driver (optional)"
                  options={drivers.map((d) => ({ value: d.id, label: d.name }))}
                />
              )}
            </FormField>
          </div>

          <FormField control={control} name="scheduledDate" label="Scheduled Date" required>
            {(field) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => setValue("scheduledDate", date ? date.toISOString() : "")}
              />
            )}
          </FormField>

          <FormField control={control} name="deliveryAddress" label="Delivery Address">
            {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional — defaults to customer address" />}
          </FormField>

          <FormField control={control} name="notes" label="Notes">
            {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional notes" />}
          </FormField>
        </Card>

        <Card
          title="Items"
          className="rounded-2xl"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => append({ ...EMPTY_ITEM })}>
              Add Item
            </Button>
          }
        >
          {errors.items?.message && (
            <Typography.Text type="danger" className="block mb-2">
              {errors.items.message}
            </Typography.Text>
          )}

          <div className="overflow-x-auto">
            <Table
              dataSource={fields}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Product",
                  key: "product",
                  render: (_, __, index) => (
                    <FormField control={control} name={`items.${index}.productId`} className="!mb-0">
                      {(field) => (
                        <Select
                          {...field}
                          showSearch
                          loading={optionsLoading}
                          placeholder="Select product"
                          optionFilterProp="label"
                          status={errors.items?.[index]?.productId ? "error" : ""}
                          onChange={(value) => {
                            field.onChange(value);
                            if (warehouseId) loadAvailableStock(value, warehouseId);
                          }}
                          options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                          className="w-full"
                        />
                      )}
                    </FormField>
                  ),
                },
                {
                  title: "Quantity",
                  key: "quantity",
                  width: 160,
                  render: (_, __, index) => {
                    const productId = items[index]?.productId;
                    const available = productId ? stockByProduct[productId] : undefined;
                    return (
                      <FormField control={control} name={`items.${index}.quantity`} className="!mb-0">
                        {(field) => (
                          <div>
                            <InputNumber {...field} min={0.01} max={available} className="w-full" />
                            {productId && (
                              <div className="text-xs text-neutral-400 mt-1">
                                {!warehouseId
                                  ? "Select warehouse first"
                                  : stockLoading[productId]
                                    ? "Checking stock…"
                                    : `Available: ${formatNumber(available ?? 0)}`}
                              </div>
                            )}
                          </div>
                        )}
                      </FormField>
                    );
                  },
                },
                {
                  title: "",
                  key: "actions",
                  width: 50,
                  render: (_, __, index) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={fields.length <= 1}
                      onClick={() => remove(index)}
                    />
                  ),
                },
              ]}
            />
          </div>
        </Card>
      </form>
    </Modal>
  );
}
