export const MODULES = {
  DASHBOARD: "dashboard",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  UNITS: "units",
  SUPPLIERS: "suppliers",
  CUSTOMERS: "customers",
  WAREHOUSES: "warehouses",
  INVENTORY: "inventory",
  PURCHASE_ORDERS: "purchase-orders",
  GOODS_RECEIVE_NOTES: "goods-receive-notes",
  DELIVERIES: "deliveries",
  VEHICLES: "vehicles",
  DRIVERS: "drivers",
  REPORTS: "reports",
  USERS: "users",
  ROLES: "roles",
  SETTINGS: "settings",
  AUDIT_LOGS: "audit-logs",
} as const;

export type ModuleKey = (typeof MODULES)[keyof typeof MODULES];

export interface PermissionDefinition {
  code: string;
  module: ModuleKey;
  action: string;
  description: string;
}

function perms(module: ModuleKey, actions: string[]): PermissionDefinition[] {
  return actions.map((action) => ({
    code: `${module}.${action}`,
    module,
    action,
    description: `${action} ${module}`,
  }));
}

const CRUD = ["view", "create", "update", "delete"];

export const PERMISSIONS: PermissionDefinition[] = [
  ...perms(MODULES.DASHBOARD, ["view"]),
  ...perms(MODULES.PRODUCTS, CRUD),
  ...perms(MODULES.CATEGORIES, CRUD),
  ...perms(MODULES.UNITS, CRUD),
  ...perms(MODULES.SUPPLIERS, CRUD),
  ...perms(MODULES.CUSTOMERS, CRUD),
  ...perms(MODULES.WAREHOUSES, CRUD),
  ...perms(MODULES.INVENTORY, ["view", "stockIn", "stockOut", "adjust", "transfer"]),
  ...perms(MODULES.PURCHASE_ORDERS, ["view", "create", "update", "approve", "cancel", "delete"]),
  ...perms(MODULES.GOODS_RECEIVE_NOTES, ["view", "create"]),
  ...perms(MODULES.DELIVERIES, ["view", "create", "update", "cancel", "delete"]),
  ...perms(MODULES.VEHICLES, CRUD),
  ...perms(MODULES.DRIVERS, CRUD),
  ...perms(MODULES.REPORTS, ["view", "export"]),
  ...perms(MODULES.USERS, CRUD),
  ...perms(MODULES.ROLES, CRUD),
  ...perms(MODULES.SETTINGS, ["view", "update"]),
  ...perms(MODULES.AUDIT_LOGS, ["view"]),
];

const READ_ONLY_MASTERS: ModuleKey[] = [
  MODULES.CATEGORIES,
  MODULES.UNITS,
  MODULES.SUPPLIERS,
  MODULES.CUSTOMERS,
  MODULES.WAREHOUSES,
  MODULES.VEHICLES,
  MODULES.DRIVERS,
];

export const MANAGER_PERMISSION_CODES: string[] = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "inventory.view",
  "inventory.stockIn",
  "inventory.stockOut",
  "inventory.adjust",
  "inventory.transfer",
  "purchase-orders.view",
  "purchase-orders.create",
  "purchase-orders.update",
  "goods-receive-notes.view",
  "goods-receive-notes.create",
  "deliveries.view",
  "deliveries.create",
  "deliveries.update",
  "deliveries.cancel",
  "reports.view",
  "reports.export",
  ...READ_ONLY_MASTERS.map((module) => `${module}.view`),
];

export const ADMIN_PERMISSION_CODES: string[] = PERMISSIONS.map((permission) => permission.code);
