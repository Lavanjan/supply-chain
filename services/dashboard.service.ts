import { dashboardRepository } from "@/repositories/dashboard.repository";
import type {
  DashboardChartsPayload,
  DashboardStats,
  InventoryMovementPoint,
  MonthlyPurchasePoint,
  RecentActivityItem,
  RecentOrderItem,
  TopProductPoint,
} from "@/types/dashboard.types";

const MONTHLY_PURCHASES_MONTHS = 6;
const INVENTORY_MOVEMENT_DAYS = 14;
const TOP_PRODUCTS_LIMIT = 5;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", day: "numeric" });
}

async function getStats(): Promise<DashboardStats> {
  const [totalProducts, productSnapshot, supplierCount, customerCount, purchaseOrderCount, todaysDeliveriesCount] =
    await Promise.all([
      dashboardRepository.countProducts(),
      dashboardRepository.getProductStockSnapshot(),
      dashboardRepository.countSuppliers(),
      dashboardRepository.countCustomers(),
      dashboardRepository.countPurchaseOrders(),
      dashboardRepository.countTodaysDeliveries(),
    ]);

  let currentInventoryUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const product of productSnapshot) {
    const stock = Number(product.currentStock);
    const minimum = Number(product.minimumStock);

    currentInventoryUnits += stock;

    if (stock <= 0) {
      outOfStockCount += 1;
    } else if (stock <= minimum) {
      lowStockCount += 1;
    }
  }

  return {
    totalProducts,
    currentInventoryUnits,
    lowStockCount,
    outOfStockCount,
    supplierCount,
    customerCount,
    purchaseOrderCount,
    todaysDeliveriesCount,
  };
}

async function getMonthlyPurchases(): Promise<MonthlyPurchasePoint[]> {
  const orders = await dashboardRepository.getRecentPurchaseOrdersForMonthlyTotals();

  const buckets = new Map<string, { label: string; count: number }>();
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - (MONTHLY_PURCHASES_MONTHS - 1));

  for (let i = 0; i < MONTHLY_PURCHASES_MONTHS; i++) {
    buckets.set(monthKey(cursor), { label: monthLabel(cursor), count: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const order of orders) {
    const key = monthKey(order.orderDate);
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
  }

  return Array.from(buckets.values()).map((bucket) => ({
    month: bucket.label,
    count: bucket.count,
  }));
}

async function getInventoryMovement(): Promise<InventoryMovementPoint[]> {
  const movements = await dashboardRepository.getRecentInventoryMovements();

  const buckets = new Map<string, { label: string; stockIn: number; stockOut: number }>();
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (INVENTORY_MOVEMENT_DAYS - 1));

  for (let i = 0; i < INVENTORY_MOVEMENT_DAYS; i++) {
    buckets.set(dayKey(cursor), { label: dayLabel(cursor), stockIn: 0, stockOut: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const movement of movements) {
    const bucket = buckets.get(dayKey(movement.createdAt));
    if (!bucket) continue;
    const quantity = Number(movement.quantity);
    if (movement.type === "STOCK_IN") bucket.stockIn += quantity;
    else bucket.stockOut += quantity;
  }

  return Array.from(buckets.values()).map((bucket) => ({
    date: bucket.label,
    stockIn: Math.round(bucket.stockIn * 100) / 100,
    stockOut: Math.round(bucket.stockOut * 100) / 100,
  }));
}

async function getTopProductsByStock(): Promise<TopProductPoint[]> {
  const products = await dashboardRepository.getProductStockSnapshot();

  return products
    .map((product) => ({
      name: product.name,
      quantity: Number(product.currentStock),
    }))
    .filter((product) => product.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, TOP_PRODUCTS_LIMIT);
}

async function getCharts(): Promise<DashboardChartsPayload> {
  const [monthlyPurchases, inventoryMovement, topProducts, topSuppliers] = await Promise.all([
    getMonthlyPurchases(),
    getInventoryMovement(),
    getTopProductsByStock(),
    dashboardRepository.getTopSuppliersByOrderCount(),
  ]);

  return { monthlyPurchases, inventoryMovement, topProducts, topSuppliers };
}

async function getRecentActivities(): Promise<RecentActivityItem[]> {
  const activities = await dashboardRepository.getRecentActivities();

  return activities.map((activity) => ({
    id: activity.id,
    action: activity.action,
    module: activity.module,
    description: activity.description,
    userName: activity.userName,
    createdAt: activity.createdAt.toISOString(),
  }));
}

async function getRecentOrders(): Promise<RecentOrderItem[]> {
  const orders = await dashboardRepository.getRecentOrders();

  return orders.map((order) => ({
    id: order.id,
    poNumber: order.poNumber,
    supplierName: order.supplier.companyName,
    itemCount: order._count.items,
    status: order.status,
    orderDate: order.orderDate.toISOString(),
  }));
}

export const dashboardService = {
  getStats,
  getCharts,
  getRecentActivities,
  getRecentOrders,
};
