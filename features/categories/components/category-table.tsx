"use client";

import { useState } from "react";
import { App, Button, Card, Tag, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { CategoryFormModal } from "@/features/categories/components/category-form-modal";
import type { CategoryListItem } from "@/types/category.types";

export function CategoryTable() {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const table = useDataTable<CategoryListItem>({ endpoint: "/api/categories" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(category: CategoryListItem) {
    setEditing(category);
    setModalOpen(true);
  }

  function confirmDelete(category: CategoryListItem) {
    modal.confirm({
      title: `Delete "${category.name}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/categories/${category.id}`);
          message.success("Category deleted");
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete category");
        }
      },
    });
  }

  const columns: TableColumnsType<CategoryListItem> = [
    { title: "Name", dataIndex: "name", sorter: true },
    {
      title: "Description",
      dataIndex: "description",
      render: (value: string | null) => value || <span className="text-neutral-400">—</span>,
    },
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
          {can("categories.update") && (
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          )}
          {can("categories.delete") && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<CategoryListItem>
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
        searchPlaceholder="Search categories..."
        onSortChange={table.setSort}
        emptyText="No categories yet"
        toolbarExtra={
          can("categories.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Category
            </Button>
          )
        }
        renderMobileCard={(category) => (
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong>{category.name}</Typography.Text>
                <div className="text-xs text-neutral-500">{category.description || "No description"}</div>
                <div className="text-xs text-neutral-400 mt-1">{category.productCount} products</div>
              </div>
              <Tag color={category.isActive ? "green" : "default"}>
                {category.isActive ? "Active" : "Inactive"}
              </Tag>
            </div>
            <div className="flex justify-end gap-1 mt-2">
              {can("categories.update") && (
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(category)} />
              )}
              {can("categories.delete") && (
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(category)}
                />
              )}
            </div>
          </Card>
        )}
      />

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={table.reload}
        category={editing}
      />
    </>
  );
}
