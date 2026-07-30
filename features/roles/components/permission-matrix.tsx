"use client";

import { Card, Table, Typography, type TableColumnsType } from "antd";
import { CheckCircleFilled, CloseCircleOutlined } from "@ant-design/icons";
import { ADMIN_PERMISSION_CODES, MANAGER_PERMISSION_CODES, PERMISSIONS, type ModuleKey } from "@/lib/constants/permissions";
import { MODULE_LABELS } from "@/lib/constants/navigation";

interface MatrixRow {
  key: string;
  module: string;
  action: string;
  code: string;
  adminHas: boolean;
  managerHas: boolean;
}

const adminSet = new Set(ADMIN_PERMISSION_CODES);
const managerSet = new Set(MANAGER_PERMISSION_CODES);

const MODULE_ORDER = Object.keys(MODULE_LABELS) as ModuleKey[];

const rows: MatrixRow[] = MODULE_ORDER.flatMap((moduleKey) =>
  PERMISSIONS.filter((permission) => permission.module === moduleKey).map((permission) => ({
    key: permission.code,
    module: MODULE_LABELS[moduleKey],
    action: permission.action,
    code: permission.code,
    adminHas: adminSet.has(permission.code),
    managerHas: managerSet.has(permission.code),
  })),
);

function PermissionIcon({ granted }: { granted: boolean }) {
  return granted ? (
    <CheckCircleFilled className="text-lg" style={{ color: "#0ca30c" }} />
  ) : (
    <CloseCircleOutlined className="text-lg text-neutral-300 dark:text-neutral-600" />
  );
}

const columns: TableColumnsType<MatrixRow> = [
  {
    title: "Module",
    dataIndex: "module",
    render: (value: string) => <span className="font-medium">{value}</span>,
  },
  { title: "Action", dataIndex: "action" },
  { title: "Permission Code", dataIndex: "code", render: (value: string) => <code className="text-xs">{value}</code> },
  { title: "Admin", dataIndex: "adminHas", align: "center", render: (value: boolean) => <PermissionIcon granted={value} /> },
  { title: "Manager", dataIndex: "managerHas", align: "center", render: (value: boolean) => <PermissionIcon granted={value} /> },
];

export function PermissionMatrix() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl">
        <Typography.Paragraph className="!mb-0 text-sm text-neutral-500">
          This system uses two fixed roles. Admin has full access to every module. Manager has full operational access
          (Products, Inventory, Purchase Orders, Goods Receive Notes, Deliveries, Reports) but is restricted from User
          Management, Roles &amp; Permissions, Settings, Audit Logs, and permanent deletes.
        </Typography.Paragraph>
      </Card>

      <Card title="Permission Matrix" className="rounded-2xl">
        <div className="overflow-x-auto">
          <Table<MatrixRow> columns={columns} dataSource={rows} rowKey="key" pagination={false} size="small" scroll={{ x: "max-content" }} />
        </div>
      </Card>
    </div>
  );
}
