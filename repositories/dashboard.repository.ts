import { prisma } from "@/lib/db/prisma";

const MONTHLY_PURCHASES_MONTHS = 6;
const INVENTORY_MOVEMENT_DAYS = 14;
const RECENT_ACTIVITIES_LIMIT = 8;
const RECENT_ORDERS_LIMIT = 5;
const TOP_LIST_LIMIT = 5;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export const dashboardRepository = {
  countProducts() {
    return prisma.product.count({ where: { isDeleted: false } });
  },

  getProductStockSnapshot() {
    return prisma.product.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, currentStock: true, minimumStock: true },
    });
  },

  countSuppliers() {
    return prisma.supplier.count({ where: { isDeleted: false, status: "ACTIVE" } });
  },

  countCustomers() {
    return prisma.customer.count({ where: { isDeleted: false, status: "ACTIVE" } });
  },

  countPurchaseOrders() {
    return prisma.purchaseOrder.count({ where: { isDeleted: false } });
  },

  countTodaysDeliveries() {
    const now = new Date();
    return prisma.delivery.count({
      where: {
        isDeleted: false,
        scheduledDate: { gte: startOfDay(now), lte: endOfDay(now) },
      },
    });
  },

  getRecentPurchaseOrdersForMonthlyTotals() {
    const since = new Date();
    since.setMonth(since.getMonth() - (MONTHLY_PURCHASES_MONTHS - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    return prisma.purchaseOrder.findMany({
      where: { isDeleted: false, orderDate: { gte: since } },
      select: { orderDate: true },
    });
  },

  getRecentInventoryMovements() {
    const since = new Date();
    since.setDate(since.getDate() - (INVENTORY_MOVEMENT_DAYS - 1));
    since.setHours(0, 0, 0, 0);

    return prisma.inventoryHistory.findMany({
      where: { type: { in: ["STOCK_IN", "STOCK_OUT"] }, createdAt: { gte: since } },
      select: { createdAt: true, type: true, quantity: true },
    });
  },

  async getTopSuppliersByOrderCount() {
    const grouped = await prisma.purchaseOrder.groupBy({
      by: ["supplierId"],
      where: { isDeleted: false, status: { not: "CANCELLED" } },
      _count: { _all: true },
      orderBy: { _count: { supplierId: "desc" } },
      take: TOP_LIST_LIMIT,
    });

    if (grouped.length === 0) return [];

    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: grouped.map((row) => row.supplierId) } },
      select: { id: true, companyName: true },
    });
    const nameById = new Map(suppliers.map((supplier) => [supplier.id, supplier.companyName]));

    return grouped.map((row) => ({
      name: nameById.get(row.supplierId) ?? "Unknown supplier",
      count: row._count._all,
    }));
  },

  getRecentActivities() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_ACTIVITIES_LIMIT,
      select: {
        id: true,
        action: true,
        module: true,
        description: true,
        userName: true,
        createdAt: true,
      },
    });
  },

  getRecentOrders() {
    return prisma.purchaseOrder.findMany({
      where: { isDeleted: false },
      orderBy: { orderDate: "desc" },
      take: RECENT_ORDERS_LIMIT,
      select: {
        id: true,
        poNumber: true,
        status: true,
        orderDate: true,
        supplier: { select: { companyName: true } },
        _count: { select: { items: true } },
      },
    });
  },
};
