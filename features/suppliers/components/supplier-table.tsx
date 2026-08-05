"use client";

import { useState } from "react";
import { App, Button, Card, Descriptions, Popover, Select, Tag, Typography, type TableColumnsType } from "antd";
import { BankOutlined, DeleteOutlined, EditOutlined, MailOutlined, PhoneOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { SupplierFormModal } from "@/features/suppliers/components/supplier-form-modal";
import type { SupplierListItem } from "@/types/supplier.types";

const STATUS_COLORS: Record<string, string> = { ACTIVE: "green", INACTIVE: "default" };

function BankDetails({ supplier }: { supplier: SupplierListItem }) {
  if (!supplier.bankName && !supplier.bankAccountNumber) {
    return <Popover content="No bank details on file"><Button type="text" icon={<BankOutlined />} disabled /></Popover>;
  }
  return (
    <Popover
      title="Bank Details"
      content={
        <Descriptions column={1} size="small" className="max-w-xs">
          <Descriptions.Item label="Bank">{supplier.bankName || "—"}</Descriptions.Item>
          <Descriptions.Item label="Branch">{supplier.bankBranch || "—"}</Descriptions.Item>
          <Descriptions.Item label="Account Name">{supplier.bankAccountName || "—"}</Descriptions.Item>
          <Descriptions.Item label="Account Number">{supplier.bankAccountNumber || "—"}</Descriptions.Item>
        </Descriptions>
      }
    >
      <Button type="text" icon={<BankOutlined />} />
    </Popover>
  );
}

export function SupplierTable() {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const [status, setStatus] = useState<string | undefined>();
  const table = useDataTable<SupplierListItem>({ endpoint: "/api/suppliers", extraParams: { status } });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(supplier: SupplierListItem) {
    setEditing(supplier);
    setModalOpen(true);
  }

  function confirmDelete(supplier: SupplierListItem) {
    modal.confirm({
      title: `Delete "${supplier.companyName}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/suppliers/${supplier.id}`);
          message.success("Supplier deleted");
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete supplier");
        }
      },
    });
  }

  const columns: TableColumnsType<SupplierListItem> = [
    { title: "Company", dataIndex: "companyName", sorter: true },
    { title: "Contact Person", dataIndex: "contactPerson", sorter: true },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (value: string) => (
        <span className="flex items-center gap-1">
          <PhoneOutlined className="text-neutral-400" /> {value}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (value: string | null) =>
        value ? (
          <span className="flex items-center gap-1">
            <MailOutlined className="text-neutral-400" /> {value}
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    { title: "Bank", key: "bank", render: (_, record) => <BankDetails supplier={record} /> },
    {
      title: "Status",
      dataIndex: "status",
      sorter: true,
      render: (value: string) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          {can("suppliers.update") && (
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          )}
          {can("suppliers.delete") && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<SupplierListItem>
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
        searchPlaceholder="Search suppliers..."
        onSortChange={table.setSort}
        emptyText="No suppliers yet"
        filters={
          <Select
            allowClear
            placeholder="Status"
            className="w-36"
            value={status}
            onChange={setStatus}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        }
        toolbarExtra={
          can("suppliers.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Supplier
            </Button>
          )
        }
        renderMobileCard={(supplier) => (
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {supplier.companyName}
                </Typography.Text>
                <span className="text-xs text-neutral-500">{supplier.contactPerson}</span>
              </div>
              <Tag color={STATUS_COLORS[supplier.status]}>{supplier.status}</Tag>
            </div>
            <div className="text-sm mt-2 flex flex-col gap-1">
              <span className="flex items-center gap-1">
                <PhoneOutlined className="text-neutral-400" /> {supplier.phone}
              </span>
              {supplier.email && (
                <span className="flex items-center gap-1">
                  <MailOutlined className="text-neutral-400" /> {supplier.email}
                </span>
              )}
            </div>
            <div className="flex justify-end gap-1 mt-2">
              <BankDetails supplier={supplier} />
              {can("suppliers.update") && (
                <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(supplier)} />
              )}
              {can("suppliers.delete") && (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(supplier)} />
              )}
            </div>
          </Card>
        )}
      />

      <SupplierFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={table.reload}
        supplier={editing}
      />
    </>
  );
}
