export interface DashboardStats {
  totalProducts: number;
  currentInventoryUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  supplierCount: number;
  customerCount: number;
  purchaseOrderCount: number;
  todaysDeliveriesCount: number;
}

export interface MonthlyPurchasePoint {
  month: string;
  count: number;
}

export interface InventoryMovementPoint {
  date: string;
  stockIn: number;
  stockOut: number;
}

export interface TopProductPoint {
  name: string;
  quantity: number;
}

export interface TopSupplierPoint {
  name: string;
  count: number;
}

export interface DashboardChartsPayload {
  monthlyPurchases: MonthlyPurchasePoint[];
  inventoryMovement: InventoryMovementPoint[];
  topProducts: TopProductPoint[];
  topSuppliers: TopSupplierPoint[];
}

export interface RecentActivityItem {
  id: string;
  action: string;
  module: string;
  description: string | null;
  userName: string;
  createdAt: string;
}

export interface RecentOrderItem {
  id: string;
  poNumber: string;
  supplierName: string;
  itemCount: number;
  status: string;
  orderDate: string;
}
