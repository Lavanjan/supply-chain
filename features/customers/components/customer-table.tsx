"use client";

import { useState } from "react";
import { App, Button, Card, Select, Tag, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, MailOutlined, PhoneOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { CUSTOMER_TYPE_COLORS, CUSTOMER_TYPE_LABELS } from "@/lib/constants/customer";
import { CustomerFormModal } from "@/features/customers/components/customer-form-modal";
import type { CustomerListItem } from "@/types/customer.types";

const STATUS_COLORS: Record<string, string> = { ACTIVE: "green", INACTIVE: "default" };

const TYPE_FILTER_OPTIONS = Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function CustomerTable() {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const [status, setStatus] = useState<string | undefined>();
  const [customerType, setCustomerType] = useState<string | undefined>();
  const table = useDataTable<CustomerListItem>({
    endpoint: "/api/customers",
    extraParams: { status, customerType },
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(customer: CustomerListItem) {
    setEditing(customer);
    setModalOpen(true);
  }

  function confirmDelete(customer: CustomerListItem) {
    modal.confirm({
      title: `Delete "${customer.companyName}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/customers/${customer.id}`);
          message.success("Customer deleted");
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete customer");
        }
      },
    });
  }

  const columns: TableColumnsType<CustomerListItem> = [
    { title: "Company", dataIndex: "companyName", sorter: true },
    {
      title: "Type",
      dataIndex: "customerType",
      sorter: true,
      render: (value: CustomerListItem["customerType"]) => (
        <Tag color={CUSTOMER_TYPE_COLORS[value]}>{CUSTOMER_TYPE_LABELS[value]}</Tag>
      ),
    },
    {
      title: "Contact Person",
      dataIndex: "contactPerson",
      render: (value: string | null) => value || <span className="text-neutral-400">—</span>,
    },
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
          {can("customers.update") && (
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          )}
          {can("customers.delete") && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<CustomerListItem>
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
        searchPlaceholder="Search customers..."
        onSortChange={table.setSort}
        emptyText="No customers yet"
        filters={
          <div className="flex gap-2 flex-wrap">
            <Select
              allowClear
              placeholder="Type"
              className="w-40"
              value={customerType}
              onChange={setCustomerType}
              options={TYPE_FILTER_OPTIONS}
            />
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
          </div>
        }
        toolbarExtra={
          can("customers.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Customer
            </Button>
          )
        }
        renderMobileCard={(customer) => (
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {customer.companyName}
                </Typography.Text>
                <Tag color={CUSTOMER_TYPE_COLORS[customer.customerType]} className="mt-1">
                  {CUSTOMER_TYPE_LABELS[customer.customerType]}
                </Tag>
              </div>
              <Tag color={STATUS_COLORS[customer.status]}>{customer.status}</Tag>
            </div>
            <div className="text-sm mt-2 flex flex-col gap-1">
              <span className="flex items-center gap-1">
                <PhoneOutlined className="text-neutral-400" /> {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1">
                  <MailOutlined className="text-neutral-400" /> {customer.email}
                </span>
              )}
            </div>
            <div className="flex justify-end gap-1 mt-2">
              {can("customers.update") && (
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(customer)} />
              )}
              {can("customers.delete") && (
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(customer)}
                />
              )}
            </div>
          </Card>
        )}
      />

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={table.reload}
        customer={editing}
      />
    </>
  );
}
