"use client";

import { useState } from "react";
import { App, Button, Card, Tag, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { UnitFormModal } from "@/features/units/components/unit-form-modal";
import type { UnitListItem } from "@/types/unit.types";

export function UnitTable() {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const table = useDataTable<UnitListItem>({ endpoint: "/api/units" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UnitListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(unit: UnitListItem) {
    setEditing(unit);
    setModalOpen(true);
  }

  function confirmDelete(unit: UnitListItem) {
    modal.confirm({
      title: `Delete "${unit.name}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/units/${unit.id}`);
          message.success("Unit deleted");
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete unit");
        }
      },
    });
  }

  const columns: TableColumnsType<UnitListItem> = [
    { title: "Name", dataIndex: "name", sorter: true },
    { title: "Symbol", dataIndex: "symbol" },
    { title: "Products", dataIndex: "productCount", align: "right" },
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
          {can("units.update") && <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />}
          {can("units.delete") && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<UnitListItem>
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
        searchPlaceholder="Search units..."
        onSortChange={table.setSort}
        emptyText="No units yet"
        toolbarExtra={
          can("units.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Unit
            </Button>
          )
        }
        renderMobileCard={(unit) => (
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong>
                  {unit.name} ({unit.symbol})
                </Typography.Text>
                <div className="text-xs text-neutral-400 mt-1">{unit.productCount} products</div>
              </div>
              <Tag color={unit.isActive ? "green" : "default"}>{unit.isActive ? "Active" : "Inactive"}</Tag>
            </div>
            <div className="flex justify-end gap-1 mt-2">
              {can("units.update") && (
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(unit)} />
              )}
              {can("units.delete") && (
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(unit)} />
              )}
            </div>
          </Card>
        )}
      />

      <UnitFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={table.reload} unit={editing} />
    </>
  );
}
