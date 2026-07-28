import { prisma } from "@/lib/db/prisma";
import type { InventoryMovementType, Prisma } from "@/lib/generated/prisma/client";

interface FindManyStockParams {
  skip: number;
  take: number;
  search?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

function buildStockWhere(
  params: Pick<FindManyStockParams, "search" | "warehouseId">,
): Prisma.InventoryWhereInput {
  return {
    ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
    ...(params.search
      ? {
          OR: [
            { product: { name: { contains: params.search, mode: "insensitive" } } },
            { product: { sku: { contains: params.search, mode: "insensitive" } } },
            { batchNumber: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

const STOCK_SORTABLE_FIELDS = new Set(["quantity", "expiryDate", "updatedAt"]);

function buildStockOrderBy(
  sortField?: string,
  sortOrder?: "ascend" | "descend",
): Prisma.InventoryOrderByWithRelationInput {
  if (sortField && STOCK_SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { updatedAt: "desc" };
}

const stockInclude = {
  product: { select: { id: true, name: true, sku: true, minimumStock: true, unit: { select: { symbol: true } } } },
  warehouse: { select: { id: true, name: true } },
} satisfies Prisma.InventoryInclude;

interface FindHistoryParams {
  skip: number;
  take: number;
  productId?: string;
  warehouseId?: string;
  type?: InventoryMovementType;
  dateFrom?: Date;
  dateTo?: Date;
}

function buildHistoryWhere(params: Omit<FindHistoryParams, "skip" | "take">): Prisma.InventoryHistoryWhereInput {
  return {
    ...(params.productId ? { productId: params.productId } : {}),
    ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          createdAt: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
  };
}

export const inventoryRepository = {
  findManyStock(params: FindManyStockParams) {
    return prisma.inventory.findMany({
      where: buildStockWhere(params),
      orderBy: buildStockOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: stockInclude,
    });
  },

  countStock(params: Pick<FindManyStockParams, "search" | "warehouseId">) {
    return prisma.inventory.count({ where: buildStockWhere(params) });
  },

  // Used for the low-stock filter, which compares two columns (quantity vs. the
  // product's minimumStock) — not expressible in a Prisma `where` without raw SQL,
  // so we fetch a generous batch and filter/paginate in the service instead.
  findAllStockForLowStockScan(params: Pick<FindManyStockParams, "search" | "warehouseId">) {
    return prisma.inventory.findMany({
      where: buildStockWhere(params),
      orderBy: { updatedAt: "desc" },
      take: 5000,
      include: stockInclude,
    });
  },

  findBatchesForProductWarehouse(productId: string, warehouseId: string) {
    return prisma.inventory.findMany({
      where: { productId, warehouseId, quantity: { gt: 0 } },
      orderBy: { expiryDate: "asc" },
    });
  },

  findHistory(params: FindHistoryParams) {
    return prisma.inventoryHistory.findMany({
      where: buildHistoryWhere(params),
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        performedBy: { select: { name: true } },
      },
    });
  },

  countHistory(params: Omit<FindHistoryParams, "skip" | "take">) {
    return prisma.inventoryHistory.count({ where: buildHistoryWhere(params) });
  },
};
