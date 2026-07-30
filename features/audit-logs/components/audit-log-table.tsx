"use client";

import { useState } from "react";
import { Button, Card, DatePicker, Modal, Select, Tag, Typography, type TableColumnsType } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import type { AuditLogListItem } from "@/types/audit-log.types";

const { RangePicker } = DatePicker;

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "blue",
  LOGOUT: "default",
  LOGIN_FAILED: "red",
  CREATE: "green",
  UPDATE: "gold",
  DELETE: "red",
  APPROVE: "green",
  CANCEL: "orange",
  RESTORE: "cyan",
};

const MODULE_OPTIONS = [
  { value: "auth", label: "Auth" },
  { value: "products", label: "Products" },
  { value: "categories", label: "Categories" },
  { value: "units", label: "Units" },
  { value: "suppliers", label: "Suppliers" },
  { value: "customers", label: "Customers" },
  { value: "warehouses", label: "Warehouses" },
  { value: "inventory", label: "Inventory" },
  { value: "purchase-orders", label: "Purchase Orders" },
  { value: "goods-receive-notes", label: "Goods Receive Notes" },
  { value: "deliveries", label: "Deliveries" },
  { value: "vehicles", label: "Vehicles" },
  { value: "drivers", label: "Drivers" },
  { value: "users", label: "Users" },
];

const ACTION_OPTIONS = [
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "CANCEL",
  "RESTORE",
].map((value) => ({ value, label: value.replace("_", " ") }));

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <Typography.Text type="secondary" className="text-xs block mb-1">
        {label}
      </Typography.Text>
      <pre className="text-xs bg-black/[0.03] dark:bg-white/[0.06] rounded-lg p-3 overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export function AuditLogTable() {
  const [module, setModule] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();

  const table = useDataTable<AuditLogListItem>({
    endpoint: "/api/audit-logs",
    extraParams: { module, action, dateFrom, dateTo },
  });

  const [detail, setDetail] = useState<AuditLogListItem | null>(null);

  const columns: TableColumnsType<AuditLogListItem> = [
    { title: "Date & Time", dataIndex: "createdAt", render: (value: string) => dayjs(value).format("MMM D, YYYY h:mm:ss A") },
    { title: "User", dataIndex: "userName" },
    { title: "Action", dataIndex: "action", render: (value: string) => <Tag color={ACTION_COLORS[value]}>{value.replace("_", " ")}</Tag> },
    { title: "Module", dataIndex: "module", render: (value: string) => MODULE_OPTIONS.find((o) => o.value === value)?.label ?? value },
    { title: "Description", dataIndex: "description", render: (value: string | null) => value || "—" },
    { title: "IP Address", dataIndex: "ipAddress", render: (value: string | null) => value || "—" },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => <Button type="text" icon={<EyeOutlined />} onClick={() => setDetail(record)} />,
    },
  ];

  return (
    <>
    <DataTable<AuditLogListItem>
      columns={columns}
      dataSource={table.data}
      rowKey="id"
      loading={table.loading}
      total={table.total}
      page={table.page}
      pageSize={table.pageSize}
      onPageChange={table.setPage}
      searchValue={table.searchInput}
      onSearchChange={table.setSearchInput}
      searchPlaceholder="Search user or description..."
      onSortChange={table.setSort}
      emptyText="No audit log entries found"
      filters={
        <>
          <Select
            allowClear
            placeholder="Module"
            className="w-full sm:w-44"
            value={module}
            onChange={setModule}
            options={MODULE_OPTIONS}
          />
          <Select
            allowClear
            placeholder="Action"
            className="w-full sm:w-40"
            value={action}
            onChange={setAction}
            options={ACTION_OPTIONS}
          />
          <RangePicker
            value={dateFrom && dateTo ? [dayjs(dateFrom), dayjs(dateTo)] : null}
            onChange={(dates) => {
              if (!dates || !dates[0] || !dates[1]) {
                setDateFrom(undefined);
                setDateTo(undefined);
                return;
              }
              setDateFrom(dates[0].startOf("day").toISOString());
              setDateTo(dates[1].endOf("day").toISOString());
            }}
          />
        </>
      }
      renderMobileCard={(log) => (
        <Card size="small" className="rounded-xl" onClick={() => setDetail(log)}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <Typography.Text strong className="block">
                {log.userName}
              </Typography.Text>
              <span className="text-xs text-neutral-500">{log.description || log.module}</span>
            </div>
            <Tag color={ACTION_COLORS[log.action]}>{log.action.replace("_", " ")}</Tag>
          </div>
          <div className="text-xs text-neutral-400 mt-2">{dayjs(log.createdAt).format("MMM D, YYYY h:mm A")}</div>
        </Card>
      )}
    />

    <Modal title="Audit Log Detail" open={Boolean(detail)} onCancel={() => setDetail(null)} footer={null}>
      {detail && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <Typography.Text type="secondary" className="text-xs block">
                Date &amp; Time
              </Typography.Text>
              {dayjs(detail.createdAt).format("MMM D, YYYY h:mm:ss A")}
            </div>
            <div>
              <Typography.Text type="secondary" className="text-xs block">
                User
              </Typography.Text>
              {detail.userName}
            </div>
            <div>
              <Typography.Text type="secondary" className="text-xs block">
                Action
              </Typography.Text>
              <Tag color={ACTION_COLORS[detail.action]}>{detail.action.replace("_", " ")}</Tag>
            </div>
            <div>
              <Typography.Text type="secondary" className="text-xs block">
                Module
              </Typography.Text>
              {MODULE_OPTIONS.find((o) => o.value === detail.module)?.label ?? detail.module}
            </div>
            <div>
              <Typography.Text type="secondary" className="text-xs block">
                IP Address
              </Typography.Text>
              {detail.ipAddress || "—"}
            </div>
            <div>
              <Typography.Text type="secondary" className="text-xs block">
                Entity
              </Typography.Text>
              {detail.entityType ? `${detail.entityType} (${detail.entityId})` : "—"}
            </div>
          </div>
          {detail.description && (
            <div>
              <Typography.Text type="secondary" className="text-xs block">
                Description
              </Typography.Text>
              {detail.description}
            </div>
          )}
          <JsonBlock label="Before" value={detail.oldValues} />
          <JsonBlock label="After" value={detail.newValues} />
        </div>
      )}
    </Modal>
    </>
  );
}
