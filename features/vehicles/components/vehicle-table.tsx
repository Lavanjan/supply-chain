"use client";

import { useState } from "react";
import { App, Button, Card, Select, Tag, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { VehicleFormModal } from "@/features/vehicles/components/vehicle-form-modal";
import type { VehicleListItem } from "@/types/vehicle.types";

const STATUS_COLORS: Record<string, string> = { ACTIVE: "green", MAINTENANCE: "gold", INACTIVE: "default" };

export function VehicleTable() {
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const [status, setStatus] = useState<string | undefined>();
  const table = useDataTable<VehicleListItem>({ endpoint: "/api/vehicles", extraParams: { status } });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(vehicle: VehicleListItem) {
    setEditing(vehicle);
    setModalOpen(true);
  }

  function confirmDelete(vehicle: VehicleListItem) {
    modal.confirm({
      title: `Delete "${vehicle.plateNumber}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/vehicles/${vehicle.id}`);
          message.success("Vehicle deleted");
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete vehicle");
        }
      },
    });
  }

  const columns: TableColumnsType<VehicleListItem> = [
    { title: "Plate Number", dataIndex: "plateNumber", sorter: true },
    { title: "Type", dataIndex: "type", sorter: true },
    { title: "Capacity", dataIndex: "capacity", render: (v: string | null) => v || <span className="text-neutral-400">—</span> },
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
          {can("vehicles.update") && <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />}
          {can("vehicles.delete") && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<VehicleListItem>
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
        searchPlaceholder="Search vehicles..."
        onSortChange={table.setSort}
        emptyText="No vehicles yet"
        filters={
          <Select
            allowClear
            placeholder="Status"
            className="w-40"
            value={status}
            onChange={setStatus}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "MAINTENANCE", label: "Maintenance" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        }
        toolbarExtra={
          can("vehicles.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Vehicle
            </Button>
          )
        }
        renderMobileCard={(vehicle) => (
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {vehicle.plateNumber}
                </Typography.Text>
                <span className="text-xs text-neutral-500">
                  {vehicle.type}
                  {vehicle.capacity ? ` · ${vehicle.capacity}` : ""}
                </span>
              </div>
              <Tag color={STATUS_COLORS[vehicle.status]}>{vehicle.status}</Tag>
            </div>
            <div className="flex justify-end gap-1 mt-2">
              {can("vehicles.update") && (
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(vehicle)} />
              )}
              {can("vehicles.delete") && (
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(vehicle)} />
              )}
            </div>
          </Card>
        )}
      />

      <VehicleFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={table.reload} vehicle={editing} />
    </>
  );
}
