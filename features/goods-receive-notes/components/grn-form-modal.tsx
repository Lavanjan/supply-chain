"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Alert, Button, Card, DatePicker, Empty, Input, InputNumber, Select, Skeleton, Table } from "antd";
import { Modal } from "@/components/ui/modal";
import dayjs from "dayjs";
import { FormField } from "@/components/ui/form-field";
import { goodsReceiveNoteSchema, type GoodsReceiveNoteInput } from "@/lib/validations/goods-receive-note.schema";
import { apiClient, ApiError } from "@/lib/api/client";
import {
  useReceivablePurchaseOrderOptions,
  useReceivingDetail,
} from "@/features/goods-receive-notes/hooks/use-receivable-purchase-orders";

interface GoodsReceiveNoteFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreated?: (id: string) => void;
}

const DEFAULT_VALUES: GoodsReceiveNoteInput = {
  purchaseOrderId: "",
  receivedDate: dayjs().toISOString(),
  notes: "",
  items: [],
};

export function GoodsReceiveNoteFormModal({ open, onClose, onSuccess, onCreated }: GoodsReceiveNoteFormModalProps) {
  const { message } = App.useApp();
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

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

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
          wastedQuantity: 0,
          batchNumber: "",
          expiryDate: "",
        })),
      });
    }
  }, [detail, reset]);

  async function onSubmit(values: GoodsReceiveNoteInput) {
    if (detail) {
      for (let index = 0; index < values.items.length; index++) {
        const line = detail.items[index];
        const item = values.items[index];
        if (!line) continue;
        const received = item.receivedQuantity ?? 0;
        const wasted = item.wastedQuantity ?? 0;
        if (received < 0 || wasted < 0) {
          message.error(`${line.productName}: quantities cannot be negative.`);
          return;
        }
        if (received + wasted > line.remainingQuantity) {
          message.error(`${line.productName}: received + wastage cannot exceed the remaining ${line.remainingQuantity} ${line.unitSymbol}.`);
          return;
        }
      }
    }

    try {
      const created = await apiClient.post<{ id: string }>("/api/goods-receive-notes", values);
      message.success("Goods received");
      onSuccess?.();
      onClose();
      onCreated?.(created.id);
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  const hasOverLimitItem =
    detail?.items.some((line, index) => {
      const used = (items[index]?.receivedQuantity ?? 0) + (items[index]?.wastedQuantity ?? 0);
      return used > line.remainingQuantity;
    }) ?? false;

  return (
    <Modal
      title="Receive Goods"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={isSubmitting}
      okText="Receive Goods"
      okButtonProps={{ disabled: !purchaseOrderId || hasOverLimitItem }}
      width={1100}
      destroyOnHidden
    >
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
            {hasOverLimitItem && (
              <Alert
                type="error"
                showIcon
                message="One or more items have received + wastage greater than what remains on the order."
                className="mb-3"
              />
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
                    title: "Previously Wasted",
                    key: "previouslyWasted",
                    align: "right",
                    render: (_, __, index) => detail.items[index]?.previouslyWastedQuantity ?? 0,
                  },
                  {
                    title: "Remaining",
                    key: "remaining",
                    align: "right",
                    render: (_, __, index) => {
                      const line = detail.items[index];
                      const remaining = line?.remainingQuantity ?? 0;
                      const used = (items[index]?.receivedQuantity ?? 0) + (items[index]?.wastedQuantity ?? 0);
                      return <span className={used > remaining ? "text-red-500 font-medium" : undefined}>{remaining}</span>;
                    },
                  },
                  {
                    title: "Receive Now",
                    key: "receiveNow",
                    width: 130,
                    render: (_, __, index) => {
                      const remaining = detail.items[index]?.remainingQuantity ?? 0;
                      const wasted = items[index]?.wastedQuantity ?? 0;
                      return (
                        <FormField control={control} name={`items.${index}.receivedQuantity`} className="!mb-0">
                          {(field) => (
                            <InputNumber
                              {...field}
                              value={field.value ?? 0}
                              onChange={(value) => field.onChange(value ?? 0)}
                              min={0}
                              max={Math.max(0, remaining - wasted)}
                              className="w-full"
                            />
                          )}
                        </FormField>
                      );
                    },
                  },
                  {
                    title: "Wastage",
                    key: "wastage",
                    width: 130,
                    render: (_, __, index) => {
                      const remaining = detail.items[index]?.remainingQuantity ?? 0;
                      const received = items[index]?.receivedQuantity ?? 0;
                      return (
                        <FormField control={control} name={`items.${index}.wastedQuantity`} className="!mb-0">
                          {(field) => (
                            <InputNumber
                              {...field}
                              value={field.value ?? 0}
                              onChange={(value) => field.onChange(value ?? 0)}
                              min={0}
                              max={Math.max(0, remaining - received)}
                              className="w-full"
                            />
                          )}
                        </FormField>
                      );
                    },
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
      </form>
    </Modal>
  );
}
