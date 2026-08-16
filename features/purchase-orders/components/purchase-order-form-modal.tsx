"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Button, Card, DatePicker, Input, InputNumber, Select, Table, Typography } from "antd";
import { Modal } from "@/components/ui/modal";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { FormField } from "@/components/ui/form-field";
import { purchaseOrderSchema, type PurchaseOrderInput } from "@/lib/validations/purchase-order.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { usePurchaseOrderOptions } from "@/features/purchase-orders/hooks/use-purchase-order-options";
import type { PurchaseOrderDetail } from "@/types/purchase-order.types";

interface PurchaseOrderFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreated?: (id: string) => void;
  purchaseOrder?: PurchaseOrderDetail | null;
}

const EMPTY_ITEM = { productId: "", quantity: 1 };

function defaultValuesFrom(purchaseOrder?: PurchaseOrderDetail | null): PurchaseOrderInput {
  if (!purchaseOrder) {
    return {
      supplierId: "",
      warehouseId: "",
      orderDate: dayjs().toISOString(),
      expectedDate: "",
      notes: "",
      chequeNumber: "",
      chequeBankName: "",
      chequeDate: "",
      chequeAmount: null,
      items: [EMPTY_ITEM],
    };
  }
  return {
    supplierId: purchaseOrder.supplierId,
    warehouseId: purchaseOrder.warehouseId,
    orderDate: purchaseOrder.orderDate,
    expectedDate: purchaseOrder.expectedDate ?? "",
    notes: purchaseOrder.notes ?? "",
    chequeNumber: purchaseOrder.chequeNumber ?? "",
    chequeBankName: purchaseOrder.chequeBankName ?? "",
    chequeDate: purchaseOrder.chequeDate ?? "",
    chequeAmount: purchaseOrder.chequeAmount,
    items: purchaseOrder.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  };
}

export function PurchaseOrderFormModal({
  open,
  onClose,
  onSuccess,
  onCreated,
  purchaseOrder,
}: PurchaseOrderFormModalProps) {
  const { message } = App.useApp();
  const isEdit = Boolean(purchaseOrder);
  const { suppliers, warehouses, products, loading: optionsLoading } = usePurchaseOrderOptions();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: defaultValuesFrom(purchaseOrder),
  });

  useEffect(() => {
    if (open) {
      reset(defaultValuesFrom(purchaseOrder));
    }
  }, [open, purchaseOrder, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: PurchaseOrderInput) {
    try {
      if (isEdit && purchaseOrder) {
        await apiClient.patch(`/api/purchase-orders/${purchaseOrder.id}`, values);
        message.success("Purchase order updated");
        onSuccess?.();
        onClose();
      } else {
        const created = await apiClient.post<{ id: string }>("/api/purchase-orders", values);
        message.success("Purchase order created");
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
      title={isEdit ? "Edit Purchase Order" : "New Purchase Order"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText={isEdit ? "Save Changes" : "Create Purchase Order"}
      width={800}
      destroyOnHidden
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Card title="Order Details" className="rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField control={control} name="supplierId" label="Supplier" required>
              {(field) => (
                <Select
                  {...field}
                  showSearch
                  loading={optionsLoading}
                  status={errors.supplierId ? "error" : ""}
                  placeholder="Select supplier"
                  optionFilterProp="label"
                  options={suppliers.map((s) => ({ value: s.id, label: s.companyName }))}
                />
              )}
            </FormField>

            <FormField control={control} name="warehouseId" label="Deliver To Warehouse" required>
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
            <FormField control={control} name="orderDate" label="Order Date" required>
              {(field) => (
                <DatePicker
                  className="w-full"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => setValue("orderDate", date ? date.toISOString() : "")}
                />
              )}
            </FormField>

            <FormField control={control} name="expectedDate" label="Expected Delivery Date">
              {(field) => (
                <DatePicker
                  className="w-full"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => setValue("expectedDate", date ? date.toISOString() : "")}
                />
              )}
            </FormField>
          </div>

          <FormField control={control} name="notes" label="Notes">
            {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional notes" />}
          </FormField>
        </Card>

        <Card title="Cheque Details" className="rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField control={control} name="chequeNumber" label="Cheque Number">
              {(field) => <Input {...field} placeholder="Optional" />}
            </FormField>

            <FormField control={control} name="chequeBankName" label="Bank Name">
              {(field) => <Input {...field} placeholder="Optional" />}
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField control={control} name="chequeDate" label="Cheque Date">
              {(field) => (
                <DatePicker
                  className="w-full"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => setValue("chequeDate", date ? date.toISOString() : "")}
                />
              )}
            </FormField>

            <FormField control={control} name="chequeAmount" label="Amount">
              {(field) => (
                <InputNumber
                  {...field}
                  value={field.value ?? undefined}
                  onChange={(value) => field.onChange(value ?? null)}
                  min={0.01}
                  className="w-full"
                  placeholder="Optional"
                />
              )}
            </FormField>
          </div>
        </Card>

        <Card
          title="Line Items"
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
                  render: (_, __, index) => (
                    <FormField control={control} name={`items.${index}.quantity`} className="!mb-0">
                      {(field) => <InputNumber {...field} min={0.01} className="w-full" />}
                    </FormField>
                  ),
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
