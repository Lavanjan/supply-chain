"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { App, Button, Card, DatePicker, Input, InputNumber, Select, Table, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { FormField } from "@/components/ui/form-field";
import { purchaseOrderSchema, type PurchaseOrderInput } from "@/lib/validations/purchase-order.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/format";
import { usePurchaseOrderOptions } from "@/features/purchase-orders/hooks/use-purchase-order-options";
import type { PurchaseOrderDetail } from "@/types/purchase-order.types";

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseOrderDetail;
}

const EMPTY_ITEM = { productId: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0 };

function defaultValuesFrom(purchaseOrder?: PurchaseOrderDetail): PurchaseOrderInput {
  if (!purchaseOrder) {
    return {
      supplierId: "",
      warehouseId: "",
      orderDate: dayjs().toISOString(),
      expectedDate: "",
      notes: "",
      items: [EMPTY_ITEM],
    };
  }
  return {
    supplierId: purchaseOrder.supplierId,
    warehouseId: purchaseOrder.warehouseId,
    orderDate: purchaseOrder.orderDate,
    expectedDate: purchaseOrder.expectedDate ?? "",
    notes: purchaseOrder.notes ?? "",
    items: purchaseOrder.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      tax: item.tax,
    })),
  };
}

export function PurchaseOrderForm({ purchaseOrder }: PurchaseOrderFormProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const isEdit = Boolean(purchaseOrder);
  const { suppliers, warehouses, products, loading: optionsLoading } = usePurchaseOrderOptions();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: defaultValuesFrom(purchaseOrder),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const lineTotals = items.map((item) => {
    const gross = (item.quantity || 0) * (item.unitPrice || 0);
    return Math.round((gross - (item.discount || 0) + (item.tax || 0)) * 100) / 100;
  });
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.tax || 0), 0);
  const totalAmount = subtotal - discountAmount + taxAmount;

  async function onSubmit(values: PurchaseOrderInput) {
    try {
      if (isEdit && purchaseOrder) {
        await apiClient.patch(`/api/purchase-orders/${purchaseOrder.id}`, values);
        message.success("Purchase order updated");
        router.push(`/dashboard/purchase-orders/${purchaseOrder.id}`);
      } else {
        const created = await apiClient.post<{ id: string }>("/api/purchase-orders", values);
        message.success("Purchase order created");
        router.push(`/dashboard/purchase-orders/${created.id}`);
      }
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
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

      <Card
        title="Line Items"
        className="rounded-2xl"
        extra={
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => append({ ...EMPTY_ITEM })}
          >
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
                width: 260,
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
                          const product = products.find((p) => p.id === value);
                          if (product) setValue(`items.${index}.unitPrice`, product.purchasePrice);
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
                width: 110,
                render: (_, __, index) => (
                  <FormField control={control} name={`items.${index}.quantity`} className="!mb-0">
                    {(field) => <InputNumber {...field} min={0.01} className="w-full" />}
                  </FormField>
                ),
              },
              {
                title: "Unit Price",
                key: "unitPrice",
                width: 120,
                render: (_, __, index) => (
                  <FormField control={control} name={`items.${index}.unitPrice`} className="!mb-0">
                    {(field) => <InputNumber {...field} min={0} prefix="$" className="w-full" />}
                  </FormField>
                ),
              },
              {
                title: "Discount",
                key: "discount",
                width: 110,
                render: (_, __, index) => (
                  <FormField control={control} name={`items.${index}.discount`} className="!mb-0">
                    {(field) => <InputNumber {...field} min={0} prefix="$" className="w-full" />}
                  </FormField>
                ),
              },
              {
                title: "Tax",
                key: "tax",
                width: 110,
                render: (_, __, index) => (
                  <FormField control={control} name={`items.${index}.tax`} className="!mb-0">
                    {(field) => <InputNumber {...field} min={0} prefix="$" className="w-full" />}
                  </FormField>
                ),
              },
              {
                title: "Total",
                key: "total",
                width: 110,
                align: "right",
                render: (_, __, index) => <span className="font-medium">{formatCurrency(lineTotals[index] ?? 0)}</span>,
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

        <div className="flex justify-end mt-4">
          <div className="w-full sm:w-72 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Discount</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Tax</span>
              <span>+{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-black/10 dark:border-white/10 pt-1 mt-1">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={() => router.back()}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          {isEdit ? "Save Changes" : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  );
}
