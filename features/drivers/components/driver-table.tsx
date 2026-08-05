"use client";

import { useState } from "react";
import { App, Button, Card, Select, Tag, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PhoneOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { DriverFormModal } from "@/features/drivers/components/driver-form-modal";
import type { DriverListItem } from "@/types/driver.types";

const STATUS_COLORS: Record<string, string> = { ACTIVE: "green", INACTIVE: "default" };

export function DriverTable() {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const [status, setStatus] = useState<string | undefined>();
  const table = useDataTable<DriverListItem>({ endpoint: "/api/drivers", extraParams: { status } });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DriverListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(driver: DriverListItem) {
    setEditing(driver);
    setModalOpen(true);
  }

  function confirmDelete(driver: DriverListItem) {
    modal.confirm({
      title: `Delete "${driver.name}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/drivers/${driver.id}`);
          message.success("Driver deleted");
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete driver");
        }
      },
    });
  }

  const columns: TableColumnsType<DriverListItem> = [
    { title: "Name", dataIndex: "name", sorter: true },
    { title: "License Number", dataIndex: "licenseNumber", sorter: true },
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
          {can("drivers.update") && <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />}
          {can("drivers.delete") && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<DriverListItem>
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
        searchPlaceholder="Search drivers..."
        onSortChange={table.setSort}
        emptyText="No drivers yet"
        filters={
          <Select
            allowClear
            placeholder="Status"
            className="w-40"
            value={status}
            onChange={setStatus}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        }
        toolbarExtra={
          can("drivers.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Driver
            </Button>
          )
        }
        renderMobileCard={(driver) => (
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {driver.name}
                </Typography.Text>
                <span className="text-xs text-neutral-500">{driver.licenseNumber}</span>
              </div>
              <Tag color={STATUS_COLORS[driver.status]}>{driver.status}</Tag>
            </div>
            <div className="text-sm mt-2 flex items-center gap-1">
              <PhoneOutlined className="text-neutral-400" /> {driver.phone}
            </div>
            <div className="flex justify-end gap-1 mt-2">
              {can("drivers.update") && (
                <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(driver)} />
              )}
              {can("drivers.delete") && (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(driver)} />
              )}
            </div>
          </Card>
        )}
      />

      <DriverFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={table.reload} driver={editing} />
    </>
  );
}
