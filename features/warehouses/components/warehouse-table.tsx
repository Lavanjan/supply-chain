"use client";

import { useState } from "react";
import { App, Button, Card, Tag, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { WarehouseFormModal } from "@/features/warehouses/components/warehouse-form-modal";
import type { WarehouseListItem } from "@/types/warehouse.types";

export function WarehouseTable() {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const table = useDataTable<WarehouseListItem>({ endpoint: "/api/warehouses" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(warehouse: WarehouseListItem) {
    setEditing(warehouse);
    setModalOpen(true);
  }

  function confirmDelete(warehouse: WarehouseListItem) {
    modal.confirm({
      title: `Delete "${warehouse.name}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/warehouses/${warehouse.id}`);
          message.success("Warehouse deleted");
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete warehouse");
        }
      },
    });
  }

  const columns: TableColumnsType<WarehouseListItem> = [
    { title: "Name", dataIndex: "name", sorter: true },
    { title: "Code", dataIndex: "code" },
    { title: "Manager", dataIndex: "managerName", render: (v: string | null) => v || <span className="text-neutral-400">—</span> },
    { title: "Phone", dataIndex: "phone", render: (v: string | null) => v || <span className="text-neutral-400">—</span> },
    { title: "Stocked Items", dataIndex: "inventoryCount", align: "right" },
    {
      title: "Status",
      dataIndex: "isActive",
      sorter: true,
      render: (value: boolean) => <Tag color={value ? "green" : "default"}>{value ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          {can("warehouses.update") && (
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          )}
          {can("warehouses.delete") && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<WarehouseListItem>
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
        searchPlaceholder="Search warehouses..."
        onSortChange={table.setSort}
        emptyText="No warehouses yet"
        toolbarExtra={
          can("warehouses.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Warehouse
            </Button>
          )
        }
        renderMobileCard={(warehouse) => (
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {warehouse.name}
                </Typography.Text>
                <span className="text-xs text-neutral-500">{warehouse.code}</span>
              </div>
              <Tag color={warehouse.isActive ? "green" : "default"}>{warehouse.isActive ? "Active" : "Inactive"}</Tag>
            </div>
            <div className="text-xs text-neutral-400 mt-1">{warehouse.inventoryCount} items stocked</div>
            <div className="flex justify-end gap-1 mt-2">
              {can("warehouses.update") && (
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(warehouse)} />
              )}
              {can("warehouses.delete") && (
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(warehouse)}
                />
              )}
            </div>
          </Card>
        )}
      />

      <WarehouseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={table.reload}
        warehouse={editing}
      />
    </>
  );
}
