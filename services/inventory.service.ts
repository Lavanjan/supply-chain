import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { inventoryRepository } from "@/repositories/inventory.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { Prisma, InventoryMovementType } from "@/lib/generated/prisma/client";
import type { StockInInput, StockOutInput, AdjustmentInput, TransferInput } from "@/lib/validations/inventory.schema";
import type { InventoryBatchOption, InventoryHistoryItem, InventoryStockItem } from "@/types/inventory.types";

export class InventoryServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface ActorContext {
  userId: string;
  userName: string;
  ipAddress: string | null;
}

interface StockListParams {
  page: number;
  pageSize: number;
  search?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

interface HistoryListParams {
  page: number;
  pageSize: number;
  productId?: string;
  warehouseId?: string;
  type?: InventoryMovementType;
  dateFrom?: string;
  dateTo?: string;
}

type StockRow = Prisma.InventoryGetPayload<{
  include: {
    product: { select: { id: true; name: true; sku: true; minimumStock: true; unit: { select: { symbol: true } } } };
    warehouse: { select: { id: true; name: true } };
  };
}>;

function toStockItem(row: StockRow): InventoryStockItem {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.product.name,
    sku: row.product.sku,
    unitSymbol: row.product.unit.symbol,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouse.name,
    quantity: Number(row.quantity),
    batchNumber: row.batchNumber,
    expiryDate: row.expiryDate ? row.expiryDate.toISOString() : null,
    minimumStock: Number(row.product.minimumStock),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function recomputeProductStock(tx: Prisma.TransactionClient, productId: string) {
  const result = await tx.inventory.aggregate({ where: { productId }, _sum: { quantity: true } });
  await tx.product.update({ where: { id: productId }, data: { currentStock: result._sum.quantity ?? 0 } });
}

interface StockInCoreParams {
  productId: string;
  warehouseId: string;
  quantity: number;
  batchNumber: string | null;
  expiryDate: Date | null;
  referenceType?: "PURCHASE_ORDER" | "GOODS_RECEIVE_NOTE" | "DELIVERY" | "MANUAL_ADJUSTMENT" | "TRANSFER";
  referenceId?: string;
  notes: string | null;
  performedById: string;
}

/**
 * Core stock-in write, callable from within a caller-managed transaction — used both by
 * the standalone Stock In action and by Goods Receive Notes, which need it alongside
 * GRN-record writes and PO-completion checks in a single atomic transaction.
 */
export async function performStockIn(tx: Prisma.TransactionClient, params: StockInCoreParams) {
  const existingRow = await tx.inventory.findFirst({
    where: { productId: params.productId, warehouseId: params.warehouseId, batchNumber: params.batchNumber },
  });

  const previousQuantity = existingRow ? Number(existingRow.quantity) : 0;
  const newQuantity = previousQuantity + params.quantity;

  if (existingRow) {
    await tx.inventory.update({
      where: { id: existingRow.id },
      data: { quantity: newQuantity, expiryDate: params.expiryDate ?? existingRow.expiryDate },
    });
  } else {
    await tx.inventory.create({
      data: {
        productId: params.productId,
        warehouseId: params.warehouseId,
        batchNumber: params.batchNumber,
        expiryDate: params.expiryDate,
        quantity: params.quantity,
      },
    });
  }

  await tx.inventoryHistory.create({
    data: {
      productId: params.productId,
      warehouseId: params.warehouseId,
      type: "STOCK_IN",
      quantity: params.quantity,
      previousQuantity,
      newQuantity,
      batchNumber: params.batchNumber,
      expiryDate: params.expiryDate,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      notes: params.notes,
      performedById: params.performedById,
    },
  });

  await recomputeProductStock(tx, params.productId);
}

async function assertProductAndWarehouseExist(productId: string, warehouseId: string) {
  const [product, warehouse] = await Promise.all([
    prisma.product.findFirst({ where: { id: productId, isDeleted: false } }),
    prisma.warehouse.findFirst({ where: { id: warehouseId, isDeleted: false } }),
  ]);
  if (!product) throw new InventoryServiceError("Product not found.", 404);
  if (!warehouse) throw new InventoryServiceError("Warehouse not found.", 404);
  return { product, warehouse };
}

export const inventoryService = {
  async listStock(params: StockListParams) {
    if (params.lowStockOnly) {
      const rows = await inventoryRepository.findAllStockForLowStockScan({
        search: params.search,
        warehouseId: params.warehouseId,
      });
      const lowStock = rows.filter((row) => Number(row.quantity) <= Number(row.product.minimumStock));
      const skip = (params.page - 1) * params.pageSize;
      const pageRows = lowStock.slice(skip, skip + params.pageSize);
      return {
        data: pageRows.map(toStockItem),
        total: lowStock.length,
        page: params.page,
        pageSize: params.pageSize,
      };
    }

    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = { search: params.search, warehouseId: params.warehouseId };
    const [rows, total] = await Promise.all([
      inventoryRepository.findManyStock({
        skip,
        take: params.pageSize,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
        ...filterArgs,
      }),
      inventoryRepository.countStock(filterArgs),
    ]);

    return { data: rows.map(toStockItem), total, page: params.page, pageSize: params.pageSize };
  },

  async listHistory(params: HistoryListParams) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = {
      productId: params.productId,
      warehouseId: params.warehouseId,
      type: params.type,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
      dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    };

    const [rows, total] = await Promise.all([
      inventoryRepository.findHistory({ skip, take: params.pageSize, ...filterArgs }),
      inventoryRepository.countHistory(filterArgs),
    ]);

    const data: InventoryHistoryItem[] = rows.map((row) => ({
      id: row.id,
      productName: row.product.name,
      sku: row.product.sku,
      warehouseName: row.warehouse.name,
      type: row.type,
      quantity: Number(row.quantity),
      previousQuantity: Number(row.previousQuantity),
      newQuantity: Number(row.newQuantity),
      batchNumber: row.batchNumber,
      expiryDate: row.expiryDate ? row.expiryDate.toISOString() : null,
      notes: row.notes,
      performedByName: row.performedBy.name,
      createdAt: row.createdAt.toISOString(),
    }));

    return { data, total, page: params.page, pageSize: params.pageSize };
  },

  async getBatches(productId: string, warehouseId: string): Promise<InventoryBatchOption[]> {
    const rows = await inventoryRepository.findBatchesForProductWarehouse(productId, warehouseId);
    return rows.map((row) => ({
      inventoryId: row.id,
      batchNumber: row.batchNumber,
      quantity: Number(row.quantity),
      expiryDate: row.expiryDate ? row.expiryDate.toISOString() : null,
    }));
  },

  async stockIn(input: StockInInput, actor: ActorContext) {
    await assertProductAndWarehouseExist(input.productId, input.warehouseId);

    const batchNumber = input.batchNumber || null;
    const expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;

    await prisma.$transaction((tx) =>
      performStockIn(tx, {
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        batchNumber,
        expiryDate,
        notes: input.notes || null,
        performedById: actor.userId,
      }),
    );

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "inventory",
      entityType: "Inventory",
      entityId: input.productId,
      description: `Stock in: +${input.quantity} for product ${input.productId}${batchNumber ? ` (batch ${batchNumber})` : ""}`,
      ipAddress: actor.ipAddress,
    });
  },

  async stockOut(input: StockOutInput, actor: ActorContext) {
    await assertProductAndWarehouseExist(input.productId, input.warehouseId);

    await prisma.$transaction(async (tx) => {
      const row = await tx.inventory.findFirst({
        where: { id: input.inventoryId, productId: input.productId, warehouseId: input.warehouseId },
      });
      if (!row) throw new InventoryServiceError("Inventory record not found.", 404);

      const previousQuantity = Number(row.quantity);
      if (input.quantity > previousQuantity) {
        throw new InventoryServiceError(
          `Cannot remove ${input.quantity} — only ${previousQuantity} available in this batch.`,
          409,
        );
      }
      const newQuantity = previousQuantity - input.quantity;

      await tx.inventory.update({ where: { id: row.id }, data: { quantity: newQuantity } });

      await tx.inventoryHistory.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: "STOCK_OUT",
          quantity: input.quantity,
          previousQuantity,
          newQuantity,
          batchNumber: row.batchNumber,
          expiryDate: row.expiryDate,
          notes: input.notes || null,
          performedById: actor.userId,
        },
      });

      await recomputeProductStock(tx, input.productId);
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "inventory",
      entityType: "Inventory",
      entityId: input.productId,
      description: `Stock out: -${input.quantity} for product ${input.productId}`,
      ipAddress: actor.ipAddress,
    });
  },

  async adjust(input: AdjustmentInput, actor: ActorContext) {
    await assertProductAndWarehouseExist(input.productId, input.warehouseId);

    await prisma.$transaction(async (tx) => {
      const row = await tx.inventory.findFirst({
        where: { id: input.inventoryId, productId: input.productId, warehouseId: input.warehouseId },
      });
      if (!row) throw new InventoryServiceError("Inventory record not found.", 404);

      const previousQuantity = Number(row.quantity);
      const newQuantity = input.newQuantity;
      const delta = newQuantity - previousQuantity;

      await tx.inventory.update({ where: { id: row.id }, data: { quantity: newQuantity } });

      await tx.inventoryHistory.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: "ADJUSTMENT",
          quantity: delta,
          previousQuantity,
          newQuantity,
          batchNumber: row.batchNumber,
          expiryDate: row.expiryDate,
          referenceType: "MANUAL_ADJUSTMENT",
          notes: input.notes,
          performedById: actor.userId,
        },
      });

      await recomputeProductStock(tx, input.productId);
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "inventory",
      entityType: "Inventory",
      entityId: input.productId,
      description: `Adjustment for product ${input.productId}: ${input.notes}`,
      ipAddress: actor.ipAddress,
    });
  },

  async transfer(input: TransferInput, actor: ActorContext) {
    await assertProductAndWarehouseExist(input.productId, input.fromWarehouseId);
    await assertProductAndWarehouseExist(input.productId, input.toWarehouseId);

    await prisma.$transaction(async (tx) => {
      const sourceRow = await tx.inventory.findFirst({
        where: { id: input.inventoryId, productId: input.productId, warehouseId: input.fromWarehouseId },
      });
      if (!sourceRow) throw new InventoryServiceError("Source inventory record not found.", 404);

      const sourcePrevious = Number(sourceRow.quantity);
      if (input.quantity > sourcePrevious) {
        throw new InventoryServiceError(
          `Cannot transfer ${input.quantity} — only ${sourcePrevious} available in this batch.`,
          409,
        );
      }
      const sourceNew = sourcePrevious - input.quantity;
      await tx.inventory.update({ where: { id: sourceRow.id }, data: { quantity: sourceNew } });

      const destRow = await tx.inventory.findFirst({
        where: { productId: input.productId, warehouseId: input.toWarehouseId, batchNumber: sourceRow.batchNumber },
      });
      const destPrevious = destRow ? Number(destRow.quantity) : 0;
      const destNew = destPrevious + input.quantity;

      if (destRow) {
        await tx.inventory.update({ where: { id: destRow.id }, data: { quantity: destNew } });
      } else {
        await tx.inventory.create({
          data: {
            productId: input.productId,
            warehouseId: input.toWarehouseId,
            batchNumber: sourceRow.batchNumber,
            expiryDate: sourceRow.expiryDate,
            quantity: input.quantity,
          },
        });
      }

      const transferRef = randomUUID();

      await tx.inventoryHistory.create({
        data: {
          productId: input.productId,
          warehouseId: input.fromWarehouseId,
          type: "TRANSFER_OUT",
          quantity: input.quantity,
          previousQuantity: sourcePrevious,
          newQuantity: sourceNew,
          batchNumber: sourceRow.batchNumber,
          expiryDate: sourceRow.expiryDate,
          referenceType: "TRANSFER",
          referenceId: transferRef,
          notes: input.notes || null,
          performedById: actor.userId,
        },
      });

      await tx.inventoryHistory.create({
        data: {
          productId: input.productId,
          warehouseId: input.toWarehouseId,
          type: "TRANSFER_IN",
          quantity: input.quantity,
          previousQuantity: destPrevious,
          newQuantity: destNew,
          batchNumber: sourceRow.batchNumber,
          expiryDate: sourceRow.expiryDate,
          referenceType: "TRANSFER",
          referenceId: transferRef,
          notes: input.notes || null,
          performedById: actor.userId,
        },
      });

      await recomputeProductStock(tx, input.productId);
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "inventory",
      entityType: "Inventory",
      entityId: input.productId,
      description: `Transfer: ${input.quantity} of product ${input.productId} between warehouses`,
      ipAddress: actor.ipAddress,
    });
  },
};
