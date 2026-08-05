"use client";

import { useState } from "react";
import { App, Avatar, Button, Card, Select, Space, Tag, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PictureOutlined, PlusOutlined, QrcodeOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/format";
import { useProductOptions } from "@/features/products/hooks/use-product-options";
import { ProductFormModal } from "@/features/products/components/product-form-modal";
import { ProductCodesModal } from "@/features/products/components/product-codes-modal";
import type { ProductListItem } from "@/types/product.types";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
  DISCONTINUED: "red",
};

export function ProductTable() {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const { categories, units } = useProductOptions();
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("products.status");

  function stockTone(product: ProductListItem): { color: string; label: string } | null {
    if (product.currentStock <= 0) return { color: "red", label: t("outOfStock") };
    if (product.currentStock <= product.minimumStock) return { color: "gold", label: t("lowStock") };
    return null;
  }

  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [unitId, setUnitId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  const table = useDataTable<ProductListItem>({
    endpoint: "/api/products",
    extraParams: { categoryId, unitId, status },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductListItem | null>(null);
  const [viewingCodes, setViewingCodes] = useState<ProductListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product: ProductListItem) {
    setEditing(product);
    setModalOpen(true);
  }

  function confirmDelete(product: ProductListItem) {
    modal.confirm({
      title: t("deleteConfirmTitle", { name: product.name }),
      content: tCommon("actions.cannotBeUndone"),
      okText: tCommon("actions.delete"),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/products/${product.id}`);
          message.success(t("deleted"));
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : t("deleteFailed"));
        }
      },
    });
  }

  const columns: TableColumnsType<ProductListItem> = [
    {
      title: t("columns.product"),
      dataIndex: "name",
      sorter: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar shape="square" size={40} src={record.imageUrl} icon={<PictureOutlined />} />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-xs text-neutral-400">{record.sku}</div>
          </div>
        </div>
      ),
    },
    { title: t("columns.category"), dataIndex: "categoryName" },
    {
      title: t("columns.unit"),
      dataIndex: "unitSymbol",
    },
    {
      title: t("columns.purchasePrice"),
      dataIndex: "purchasePrice",
      align: "right",
      sorter: true,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t("columns.sellingPrice"),
      dataIndex: "sellingPrice",
      align: "right",
      sorter: true,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t("columns.stock"),
      dataIndex: "currentStock",
      align: "right",
      sorter: true,
      render: (value: number, record) => {
        const tone = stockTone(record);
        return (
          <Space direction="vertical" size={0} align="end">
            <span>
              {value} {record.unitSymbol}
            </span>
            {tone && <Tag color={tone.color}>{tone.label}</Tag>}
          </Space>
        );
      },
    },
    {
      title: t("columns.status"),
      dataIndex: "status",
      sorter: true,
      render: (value: string) => <Tag color={STATUS_COLORS[value]}>{tStatus(value)}</Tag>,
    },
    {
      title: t("columns.actions"),
      key: "actions",
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          <Button type="text" icon={<QrcodeOutlined />} onClick={() => setViewingCodes(record)} />
          {can("products.update") && (
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          )}
          {can("products.delete") && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<ProductListItem>
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
        searchPlaceholder={t("searchPlaceholder")}
        onSortChange={table.setSort}
        emptyText={t("emptyText")}
        filters={
          <div className="flex gap-2 flex-wrap">
            <Select
              allowClear
              placeholder={t("filters.category")}
              className="w-40"
              value={categoryId}
              onChange={setCategoryId}
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
            />
            <Select
              allowClear
              placeholder={t("filters.unit")}
              className="w-32"
              value={unitId}
              onChange={setUnitId}
              options={units.map((unit) => ({ value: unit.id, label: unit.symbol }))}
            />
            <Select
              allowClear
              placeholder={t("filters.status")}
              className="w-36"
              value={status}
              onChange={setStatus}
              options={[
                { value: "ACTIVE", label: tStatus("ACTIVE") },
                { value: "INACTIVE", label: tStatus("INACTIVE") },
                { value: "DISCONTINUED", label: tStatus("DISCONTINUED") },
              ]}
            />
          </div>
        }
        toolbarExtra={
          can("products.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {t("addProduct")}
            </Button>
          )
        }
        renderMobileCard={(product) => {
          const tone = stockTone(product);
          return (
            <Card size="small" className="rounded-xl">
              <div className="flex items-start gap-3">
                <Avatar shape="square" size={48} src={product.imageUrl} icon={<PictureOutlined />} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Typography.Text strong className="block">
                        {product.name}
                      </Typography.Text>
                      <span className="text-xs text-neutral-400">{product.sku}</span>
                    </div>
                    <Tag color={STATUS_COLORS[product.status]}>{tStatus(product.status)}</Tag>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span>{formatCurrency(product.sellingPrice)}</span>
                    <span className="flex items-center gap-1">
                      {product.currentStock} {product.unitSymbol}
                      {tone && <Tag color={tone.color}>{tone.label}</Tag>}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-2">
                <Button type="text" icon={<QrcodeOutlined />} onClick={() => setViewingCodes(product)} />
                {can("products.update") && (
                  <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(product)} />
                )}
                {can("products.delete") && (
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(product)} />
                )}
              </div>
            </Card>
          );
        }}
      />

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={table.reload}
        product={editing}
      />

      <ProductCodesModal product={viewingCodes} onClose={() => setViewingCodes(null)} />
    </>
  );
}
