import type { ReactNode } from "react";
import {
  AppstoreOutlined,
  BarChartOutlined,
  CarOutlined,
  ClusterOutlined,
  ColumnWidthOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { MODULES, type ModuleKey } from "@/lib/constants/permissions";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
  permission: `${ModuleKey}.view`;
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "overview",
    label: "Overview",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: <DashboardOutlined />,
        permission: "dashboard.view",
      },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    items: [
      {
        key: "products",
        label: "Products",
        href: "/dashboard/products",
        icon: <ShoppingOutlined />,
        permission: "products.view",
      },
      {
        key: "categories",
        label: "Categories",
        href: "/dashboard/categories",
        icon: <AppstoreOutlined />,
        permission: "categories.view",
      },
      {
        key: "units",
        label: "Units",
        href: "/dashboard/units",
        icon: <ColumnWidthOutlined />,
        permission: "units.view",
      },
    ],
  },
  {
    key: "partners",
    label: "Partners",
    items: [
      {
        key: "suppliers",
        label: "Suppliers",
        href: "/dashboard/suppliers",
        icon: <ShopOutlined />,
        permission: "suppliers.view",
      },
      {
        key: "customers",
        label: "Customers",
        href: "/dashboard/customers",
        icon: <TeamOutlined />,
        permission: "customers.view",
      },
      {
        key: "warehouses",
        label: "Warehouses",
        href: "/dashboard/warehouses",
        icon: <HomeOutlined />,
        permission: "warehouses.view",
      },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    items: [
      {
        key: "inventory",
        label: "Inventory",
        href: "/dashboard/inventory",
        icon: <DatabaseOutlined />,
        permission: "inventory.view",
      },
      {
        key: "purchase-orders",
        label: "Purchase Orders",
        href: "/dashboard/purchase-orders",
        icon: <FileTextOutlined />,
        permission: "purchase-orders.view",
      },
      {
        key: "goods-receive-notes",
        label: "Goods Receive Notes",
        href: "/dashboard/goods-receive-notes",
        icon: <InboxOutlined />,
        permission: "goods-receive-notes.view",
      },
      {
        key: "deliveries",
        label: "Deliveries",
        href: "/dashboard/deliveries",
        icon: <CarOutlined />,
        permission: "deliveries.view",
      },
    ],
  },
  {
    key: "fleet",
    label: "Fleet",
    items: [
      {
        key: "vehicles",
        label: "Vehicles",
        href: "/dashboard/vehicles",
        icon: <ClusterOutlined />,
        permission: "vehicles.view",
      },
      {
        key: "drivers",
        label: "Drivers",
        href: "/dashboard/drivers",
        icon: <IdcardOutlined />,
        permission: "drivers.view",
      },
    ],
  },
  {
    key: "insights",
    label: "Insights",
    items: [
      {
        key: "reports",
        label: "Reports",
        href: "/dashboard/reports",
        icon: <BarChartOutlined />,
        permission: "reports.view",
      },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    items: [
      {
        key: "users",
        label: "User Management",
        href: "/dashboard/users",
        icon: <UserOutlined />,
        permission: "users.view",
      },
      {
        key: "roles",
        label: "Roles & Permissions",
        href: "/dashboard/roles",
        icon: <SafetyCertificateOutlined />,
        permission: "roles.view",
      },
      {
        key: "audit-logs",
        label: "Audit Logs",
        href: "/dashboard/audit-logs",
        icon: <FileSearchOutlined />,
        permission: "audit-logs.view",
      },
      {
        key: "settings",
        label: "Settings",
        href: "/dashboard/settings",
        icon: <SettingOutlined />,
        permission: "settings.view",
      },
    ],
  },
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  [MODULES.DASHBOARD]: "Dashboard",
  [MODULES.PRODUCTS]: "Products",
  [MODULES.CATEGORIES]: "Categories",
  [MODULES.UNITS]: "Units",
  [MODULES.SUPPLIERS]: "Suppliers",
  [MODULES.CUSTOMERS]: "Customers",
  [MODULES.WAREHOUSES]: "Warehouses",
  [MODULES.INVENTORY]: "Inventory",
  [MODULES.PURCHASE_ORDERS]: "Purchase Orders",
  [MODULES.GOODS_RECEIVE_NOTES]: "Goods Receive Notes",
  [MODULES.DELIVERIES]: "Deliveries",
  [MODULES.VEHICLES]: "Vehicles",
  [MODULES.DRIVERS]: "Drivers",
  [MODULES.REPORTS]: "Reports",
  [MODULES.USERS]: "User Management",
  [MODULES.ROLES]: "Roles & Permissions",
  [MODULES.SETTINGS]: "Settings",
  [MODULES.AUDIT_LOGS]: "Audit Logs",
};
