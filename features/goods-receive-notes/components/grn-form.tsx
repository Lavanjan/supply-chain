"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { App, Alert, Button, Card, DatePicker, Empty, Input, InputNumber, Select, Skeleton, Table } from "antd";
import dayjs from "dayjs";
import { FormField } from "@/components/ui/form-field";
import { goodsReceiveNoteSchema, type GoodsReceiveNoteInput } from "@/lib/validations/goods-receive-note.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import {
  useReceivablePurchaseOrderOptions,
  useReceivingDetail,
} from "@/features/goods-receive-notes/hooks/use-receivable-purchase-orders";

const DEFAULT_VALUES: GoodsReceiveNoteInput = {
  purchaseOrderId: "",
  receivedDate: dayjs().toISOString(),
  notes: "",
  items: [],
};

export function GoodsReceiveNoteForm() {
  const { message } = App.useApp();
  const router = useRouter();
  const { options, loading: optionsLoading } = useReceivablePurchaseOrderOptions();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoodsReceiveNoteInput>({
    resolver: zodResolver(goodsReceiveNoteSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const purchaseOrderId = watch("purchaseOrderId");
  const { detail, loading: detailLoading } = useReceivingDetail(purchaseOrderId || undefined);
  const { fields } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  useEffect(() => {
    if (detail) {
      reset({
        purchaseOrderId: detail.id,
        receivedDate: dayjs().toISOString(),
        notes: "",
        items: detail.items.map((item) => ({
          purchaseItemId: item.purchaseItemId,
          productId: item.productId,
          receivedQuantity: item.remainingQuantity,
          batchNumber: "",
          expiryDate: "",
        })),
      });
    }
  }, [detail, reset]);

  async function onSubmit(values: GoodsReceiveNoteInput) {
    try {
      const created = await apiClient.post<{ id: string }>("/api/goods-receive-notes", values);
      message.success("Goods received");
      router.push(`/dashboard/goods-receive-notes/${created.id}`);
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Card title="Receive Against Purchase Order" className="rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField control={control} name="purchaseOrderId" label="Purchase Order" required>
            {(field) => (
              <Select
                {...field}
                showSearch
                loading={optionsLoading}
                status={errors.purchaseOrderId ? "error" : ""}
                placeholder="Select an approved purchase order"
                optionFilterProp="label"
                options={options.map((po) => ({ value: po.id, label: `${po.poNumber} — ${po.supplierName}` }))}
              />
            )}
          </FormField>

          <FormField control={control} name="receivedDate" label="Received Date" required>
            {(field) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => setValue("receivedDate", date ? date.toISOString() : "")}
              />
            )}
          </FormField>
        </div>

        <FormField control={control} name="notes" label="Notes">
          {(field) => <Input.TextArea {...field} rows={2} placeholder="Optional notes" />}
        </FormField>
      </Card>

      {!purchaseOrderId && (
        <Card className="rounded-2xl">
          <Empty description="Select a purchase order to see its items" />
        </Card>
      )}

      {purchaseOrderId && detailLoading && (
        <Card className="rounded-2xl">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      )}

      {purchaseOrderId && !detailLoading && detail && (
        <Card title="Items to Receive" className="rounded-2xl">
          {errors.items?.message && (
            <Alert type="error" showIcon message={errors.items.message} className="mb-3" />
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
                  render: (_, __, index) => {
                    const line = detail.items[index];
                    return (
                      <div>
                        <div className="font-medium">{line?.productName}</div>
                        <div className="text-xs text-neutral-400">{line?.sku}</div>
                      </div>
                    );
                  },
                },
                {
                  title: "Ordered",
                  key: "ordered",
                  align: "right",
                  render: (_, __, index) => {
                    const line = detail.items[index];
                    return `${line?.orderedQuantity} ${line?.unitSymbol}`;
                  },
                },
                {
                  title: "Previously Received",
                  key: "previouslyReceived",
                  align: "right",
                  render: (_, __, index) => detail.items[index]?.previouslyReceivedQuantity ?? 0,
                },
                {
                  title: "Remaining",
                  key: "remaining",
                  align: "right",
                  render: (_, __, index) => detail.items[index]?.remainingQuantity ?? 0,
                },
                {
                  title: "Receive Now",
                  key: "receiveNow",
                  width: 130,
                  render: (_, __, index) => (
                    <FormField control={control} name={`items.${index}.receivedQuantity`} className="!mb-0">
                      {(field) => <InputNumber {...field} min={0} className="w-full" />}
                    </FormField>
                  ),
                },
                {
                  title: "Batch Number",
                  key: "batch",
                  width: 150,
                  render: (_, __, index) => (
                    <FormField control={control} name={`items.${index}.batchNumber`} className="!mb-0">
                      {(field) => <Input {...field} placeholder="Optional" />}
                    </FormField>
                  ),
                },
                {
                  title: "Expiry Date",
                  key: "expiry",
                  width: 160,
                  render: (_, __, index) => (
                    <DatePicker
                      className="w-full"
                      value={items[index]?.expiryDate ? dayjs(items[index].expiryDate) : null}
                      onChange={(date) => setValue(`items.${index}.expiryDate`, date ? date.toISOString() : "")}
                    />
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={() => router.back()}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={!purchaseOrderId}>
          Receive Goods
        </Button>
      </div>
    </form>
  );
}
