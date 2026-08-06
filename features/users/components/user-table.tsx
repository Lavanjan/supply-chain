"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { App, Button, Card, Select, Tag, Tooltip, Typography, type TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, KeyOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { usePermission } from "@/hooks/use-permission";
import { apiClient, ApiError } from "@/lib/api/client";
import { UserFormModal } from "@/features/users/components/user-form-modal";
import { ResetPasswordModal } from "@/features/users/components/reset-password-modal";
import { useRoleOptions } from "@/features/users/hooks/use-role-options";
import type { UserListItem } from "@/types/user.types";

export function UserTable() {
  const { can } = usePermission();
  const { data: session } = useSession();
  const { modal, message } = App.useApp();
  const { roles } = useRoleOptions();
  const [roleId, setRoleId] = useState<string | undefined>();
  const [isActive, setIsActive] = useState<string | undefined>();
  const table = useDataTable<UserListItem>({
    endpoint: "/api/users",
    extraParams: { roleId, isActive },
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(user: UserListItem) {
    setEditing(user);
    setModalOpen(true);
  }

  function confirmDelete(user: UserListItem) {
    modal.confirm({
      title: `Delete "${user.name}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/api/users/${user.id}`);
          message.success("User deleted");
          table.reload();
        } catch (error) {
          message.error(error instanceof ApiError ? error.message : "Unable to delete user");
        }
      },
    });
  }

  const columns: TableColumnsType<UserListItem> = [
    {
      title: "Name",
      key: "name",
      sorter: true,
      dataIndex: "name",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{record.name}</span>
          {record.id === session?.user.id && <Tag>You</Tag>}
        </div>
      ),
    },
    { title: "Username", dataIndex: "username" },
    {
      title: "Role",
      dataIndex: "roleName",
      sorter: true,
      render: (value: string) => <Tag color={value === "ADMIN" ? "purple" : "blue"}>{value === "ADMIN" ? "Admin" : "Manager"}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (value: boolean) => <Tag color={value ? "green" : "default"}>{value ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Last Login",
      dataIndex: "lastLoginAt",
      render: (value: string | null) => (value ? dayjs(value).format("MMM D, YYYY h:mm A") : "Never"),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          {can("users.update") && (
            <Tooltip title="Reset password">
              <Button type="text" icon={<KeyOutlined />} onClick={() => setResettingUser(record)} />
            </Tooltip>
          )}
          {can("users.update") && <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />}
          {can("users.delete") && record.id !== session?.user.id && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<UserListItem>
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
        searchPlaceholder="Search name or username..."
        onSortChange={table.setSort}
        emptyText="No users yet"
        filters={
          <>
            <Select
              allowClear
              placeholder="Role"
              className="w-36"
              value={roleId}
              onChange={setRoleId}
              options={roles.map((role) => ({ value: role.id, label: role.name === "ADMIN" ? "Admin" : "Manager" }))}
            />
            <Select
              allowClear
              placeholder="Status"
              className="w-36"
              value={isActive}
              onChange={setIsActive}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
          </>
        }
        toolbarExtra={
          can("users.create") && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add User
            </Button>
          )
        }
        renderMobileCard={(user) => (
          <Card size="small" className="rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Typography.Text strong className="block">
                  {user.name} {user.id === session?.user.id && <Tag className="ml-1">You</Tag>}
                </Typography.Text>
                <span className="text-xs text-neutral-500">{user.username}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Tag color={user.roleName === "ADMIN" ? "purple" : "blue"}>{user.roleName === "ADMIN" ? "Admin" : "Manager"}</Tag>
                <Tag color={user.isActive ? "green" : "default"}>{user.isActive ? "Active" : "Inactive"}</Tag>
              </div>
            </div>
            <div className="flex justify-end gap-1 mt-2">
              {can("users.update") && (
                <Button type="text" icon={<KeyOutlined />} onClick={() => setResettingUser(user)} />
              )}
              {can("users.update") && (
                <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(user)} />
              )}
              {can("users.delete") && user.id !== session?.user.id && (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(user)} />
              )}
            </div>
          </Card>
        )}
      />

      <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={table.reload} user={editing} />
      <ResetPasswordModal open={resettingUser !== null} onClose={() => setResettingUser(null)} user={resettingUser} />
    </>
  );
}
