import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface InventoryReportFilters {
  categoryId?: string;
  warehouseId?: string;
}

export interface DateRangeFilters {
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PurchaseReportFilters extends DateRangeFilters {
  supplierId?: string;
  status?: string;
}

export interface DeliveryReportFilters extends DateRangeFilters {
  customerId?: string;
  status?: string;
}

export interface StockMovementReportFilters extends DateRangeFilters {
  warehouseId?: string;
  productId?: string;
  type?: string;
}

export const reportRepository = {
  getInventoryReportProducts(filters: InventoryReportFilters) {
    return prisma.product.findMany({
      where: {
        isDeleted: false,
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.warehouseId && { inventories: { some: { warehouseId: filters.warehouseId } } }),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        purchasePrice: true,
        minimumStock: true,
        category: { select: { name: true } },
        unit: { select: { symbol: true } },
        inventories: {
          where: filters.warehouseId ? { warehouseId: filters.warehouseId } : undefined,
          select: { quantity: true },
        },
      },
    });
  },

  getPurchaseOrders(filters: PurchaseReportFilters) {
    const where: Prisma.PurchaseOrderWhereInput = {
      isDeleted: false,
      ...(filters.supplierId && { supplierId: filters.supplierId }),
      ...(filters.status && { status: filters.status as never }),
      ...((filters.dateFrom || filters.dateTo) && {
        orderDate: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      }),
    };

    return prisma.purchaseOrder.findMany({
      where,
      orderBy: { orderDate: "desc" },
      select: {
        id: true,
        poNumber: true,
        orderDate: true,
        status: true,
        totalAmount: true,
        supplier: { select: { companyName: true } },
        _count: { select: { items: true } },
      },
    });
  },

  getDeliveries(filters: DeliveryReportFilters) {
    const where: Prisma.DeliveryWhereInput = {
      isDeleted: false,
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.status && { status: filters.status as never }),
      ...((filters.dateFrom || filters.dateTo) && {
        scheduledDate: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      }),
    };

    return prisma.delivery.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
      select: {
        id: true,
        deliveryNumber: true,
        scheduledDate: true,
        deliveredDate: true,
        status: true,
        customer: { select: { companyName: true } },
        warehouse: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });
  },

  getStockMovements(filters: StockMovementReportFilters) {
    const where: Prisma.InventoryHistoryWhereInput = {
      ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
      ...(filters.productId && { productId: filters.productId }),
      ...(filters.type && { type: filters.type as never }),
      ...((filters.dateFrom || filters.dateTo) && {
        createdAt: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      }),
    };

    return prisma.inventoryHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        performedBy: { select: { name: true } },
      },
    });
  },
};
