"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { App, Button, Card, DatePicker, Input, InputNumber, Select, Table, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { FormField } from "@/components/ui/form-field";
import { deliverySchema, type DeliveryInput } from "@/lib/validations/delivery.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import { useDeliveryOptions } from "@/features/deliveries/hooks/use-delivery-options";
import type { DeliveryDetail } from "@/types/delivery.types";

interface DeliveryFormProps {
  delivery?: DeliveryDetail;
}

const EMPTY_ITEM = { productId: "", quantity: 1 };

function defaultValuesFrom(delivery?: DeliveryDetail): DeliveryInput {
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

export function DeliveryForm({ delivery }: DeliveryFormProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const isEdit = Boolean(delivery);
  const { customers, warehouses, vehicles, drivers, products, loading: optionsLoading } = useDeliveryOptions();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryInput>({
    resolver: zodResolver(deliverySchema),
    defaultValues: defaultValuesFrom(delivery),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: DeliveryInput) {
    try {
      if (isEdit && delivery) {
        await apiClient.patch(`/api/deliveries/${delivery.id}`, values);
        message.success("Delivery updated");
        router.push(`/dashboard/deliveries/${delivery.id}`);
      } else {
        const created = await apiClient.post<{ id: string }>("/api/deliveries", values);
        message.success("Delivery scheduled");
        router.push(`/dashboard/deliveries/${created.id}`);
      }
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
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
                width: 140,
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

      <div className="flex justify-end gap-2">
        <Button onClick={() => router.back()}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          {isEdit ? "Save Changes" : "Schedule Delivery"}
        </Button>
      </div>
    </form>
  );
}
