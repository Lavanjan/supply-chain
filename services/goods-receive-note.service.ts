import { prisma } from "@/lib/db/prisma";
import { goodsReceiveNoteRepository } from "@/repositories/goods-receive-note.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import { performStockIn } from "@/services/inventory.service";
import type { GoodsReceiveNoteInput } from "@/lib/validations/goods-receive-note.schema";
import type { PaginationParams } from "@/types/api.types";
import type { GoodsReceiveNoteDetail, GoodsReceiveNoteListItem } from "@/types/goods-receive-note.types";
import type { Prisma } from "@/lib/generated/prisma/client";

export class GoodsReceiveNoteServiceError extends Error {
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

type ListRow = Prisma.GoodsReceiveNoteGetPayload<{
  include: {
    purchaseOrder: { select: { poNumber: true; supplier: { select: { companyName: true } } } };
    warehouse: { select: { name: true } };
    _count: { select: { items: true } };
  };
}>;

function toListItem(row: ListRow, receivedByName: string): GoodsReceiveNoteListItem {
  return {
    id: row.id,
    grnNumber: row.grnNumber,
    poNumber: row.purchaseOrder.poNumber,
    supplierName: row.purchaseOrder.supplier.companyName,
    warehouseName: row.warehouse.name,
    receivedDate: row.receivedDate.toISOString(),
    status: row.status,
    itemCount: row._count.items,
    receivedById: row.receivedById,
    receivedByName,
  };
}

async function toDetail(
  row: NonNullable<Awaited<ReturnType<typeof goodsReceiveNoteRepository.findByIdWithDetail>>>,
): Promise<GoodsReceiveNoteDetail> {
  const receivedByUser = await prisma.user.findUnique({ where: { id: row.receivedById }, select: { name: true } });

  return {
    id: row.id,
    grnNumber: row.grnNumber,
    purchaseOrderId: row.purchaseOrderId,
    poNumber: row.purchaseOrder.poNumber,
    supplierName: row.purchaseOrder.supplier.companyName,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouse.name,
    receivedDate: row.receivedDate.toISOString(),
    status: row.status,
    notes: row.notes,
    receivedByName: receivedByUser?.name ?? "Unknown",
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      unitSymbol: item.product.unit.symbol,
      orderedQuantity: Number(item.orderedQuantity),
      receivedQuantity: Number(item.receivedQuantity),
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null,
      unitPrice: Number(item.unitPrice),
    })),
    createdAt: row.createdAt.toISOString(),
  };
}

export const goodsReceiveNoteService = {
  async list(params: PaginationParams & { warehouseId?: string }) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = { search: params.search, warehouseId: params.warehouseId };

    const [rows, total] = await Promise.all([
      goodsReceiveNoteRepository.findMany({ skip, take: params.pageSize, ...filterArgs }),
      goodsReceiveNoteRepository.count(filterArgs),
    ]);

    const userIds = [...new Set(rows.map((row) => row.receivedById))];
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
    const nameById = new Map(users.map((user) => [user.id, user.name]));

    return {
      data: rows.map((row) => toListItem(row, nameById.get(row.receivedById) ?? "Unknown")),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  async getById(id: string): Promise<GoodsReceiveNoteDetail> {
    const row = await goodsReceiveNoteRepository.findByIdWithDetail(id);
    if (!row) throw new GoodsReceiveNoteServiceError("Goods receive note not found.", 404);
    return toDetail(row);
  },

  async create(input: GoodsReceiveNoteInput, actor: ActorContext): Promise<GoodsReceiveNoteDetail> {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: input.purchaseOrderId, isDeleted: false, status: "APPROVED" },
      include: { items: true },
    });
    if (!po) {
      throw new GoodsReceiveNoteServiceError("Purchase order not found or not approved for receiving.", 422);
    }

    const poItemById = new Map(po.items.map((item) => [item.id, item]));
    for (const item of input.items) {
      const poItem = poItemById.get(item.purchaseItemId);
      if (!poItem || poItem.productId !== item.productId) {
        throw new GoodsReceiveNoteServiceError("One or more items do not belong to this purchase order.", 422);
      }
    }

    const itemsToReceive = input.items.filter((item) => item.receivedQuantity > 0);
    const grnNumber = await goodsReceiveNoteRepository.generateGrnNumber();

    const grnId = await prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceiveNote.create({
        data: {
          grnNumber,
          purchaseOrderId: po.id,
          warehouseId: po.warehouseId,
          receivedDate: new Date(input.receivedDate),
          receivedById: actor.userId,
          notes: input.notes || null,
          status: "COMPLETED",
          items: {
            create: input.items.map((item) => {
              const poItem = poItemById.get(item.purchaseItemId)!;
              return {
                purchaseItemId: item.purchaseItemId,
                productId: item.productId,
                orderedQuantity: poItem.quantity,
                receivedQuantity: item.receivedQuantity,
                batchNumber: item.batchNumber || null,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                unitPrice: poItem.unitPrice,
              };
            }),
          },
        },
      });

      for (const item of itemsToReceive) {
        await performStockIn(tx, {
          productId: item.productId,
          warehouseId: po.warehouseId,
          quantity: item.receivedQuantity,
          batchNumber: item.batchNumber || null,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          referenceType: "GOODS_RECEIVE_NOTE",
          referenceId: grn.id,
          notes: `Received via ${grnNumber}`,
          performedById: actor.userId,
        });
      }

      const allGrnItems = await tx.goodsReceiveItem.findMany({
        where: { purchaseItem: { purchaseOrderId: po.id } },
        select: { purchaseItemId: true, receivedQuantity: true },
      });
      const receivedByPurchaseItem = new Map<string, number>();
      for (const grnItem of allGrnItems) {
        if (!grnItem.purchaseItemId) continue;
        receivedByPurchaseItem.set(
          grnItem.purchaseItemId,
          (receivedByPurchaseItem.get(grnItem.purchaseItemId) ?? 0) + Number(grnItem.receivedQuantity),
        );
      }

      const isFullyReceived = po.items.every(
        (poItem) => (receivedByPurchaseItem.get(poItem.id) ?? 0) >= Number(poItem.quantity),
      );

      if (isFullyReceived) {
        await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "COMPLETED" } });
      }

      return grn.id;
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "goods-receive-notes",
      entityType: "GoodsReceiveNote",
      entityId: grnId,
      description: `Received goods against ${po.poNumber} (${grnNumber})`,
      ipAddress: actor.ipAddress,
    });

    return this.getById(grnId);
  },
};
