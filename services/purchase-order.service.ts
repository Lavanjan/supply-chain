import { prisma } from "@/lib/db/prisma";
import { purchaseOrderRepository } from "@/repositories/purchase-order.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { PurchaseOrderInput } from "@/lib/validations/purchase-order.schema";
import type { PaginationParams } from "@/types/api.types";
import type { PurchaseOrderDetail, PurchaseOrderListItem } from "@/types/purchase-order.types";
import type {
  PurchaseOrderReceivableOption,
  ReceivablePurchaseOrder,
} from "@/types/goods-receive-note.types";
import type { Prisma, PurchaseOrderStatus } from "@/lib/generated/prisma/client";

export class PurchaseOrderServiceError extends Error {
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

interface ListParams extends PaginationParams {
  status?: PurchaseOrderStatus;
  supplierId?: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateTotals(items: PurchaseOrderInput["items"]) {
  const lineItems = items.map((item) => {
    const lineGross = item.quantity * item.unitPrice;
    const totalPrice = round2(lineGross - item.discount + item.tax);
    return { ...item, totalPrice };
  });

  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const discountAmount = round2(lineItems.reduce((sum, item) => sum + item.discount, 0));
  const taxAmount = round2(lineItems.reduce((sum, item) => sum + item.tax, 0));
  const totalAmount = round2(subtotal - discountAmount + taxAmount);

  return { lineItems, subtotal, discountAmount, taxAmount, totalAmount };
}

async function assertReferencesExist(supplierId: string, warehouseId: string, productIds: string[]) {
  const [supplier, warehouse, products] = await Promise.all([
    prisma.supplier.findFirst({ where: { id: supplierId, isDeleted: false } }),
    prisma.warehouse.findFirst({ where: { id: warehouseId, isDeleted: false } }),
    prisma.product.findMany({ where: { id: { in: productIds }, isDeleted: false }, select: { id: true } }),
  ]);

  if (!supplier) throw new PurchaseOrderServiceError("Supplier not found.", 422);
  if (!warehouse) throw new PurchaseOrderServiceError("Warehouse not found.", 422);
  if (products.length !== new Set(productIds).size) {
    throw new PurchaseOrderServiceError("One or more selected products were not found.", 422);
  }
}

type ListRow = Prisma.PurchaseOrderGetPayload<{
  include: {
    supplier: { select: { companyName: true } };
    warehouse: { select: { name: true } };
    _count: { select: { items: true } };
  };
}>;

function toListItem(row: ListRow): PurchaseOrderListItem {
  return {
    id: row.id,
    poNumber: row.poNumber,
    supplierName: row.supplier.companyName,
    warehouseName: row.warehouse.name,
    orderDate: row.orderDate.toISOString(),
    expectedDate: row.expectedDate ? row.expectedDate.toISOString() : null,
    status: row.status,
    totalAmount: Number(row.totalAmount),
    itemCount: row._count.items,
    createdAt: row.createdAt.toISOString(),
  };
}

async function toDetail(
  row: NonNullable<Awaited<ReturnType<typeof purchaseOrderRepository.findByIdWithDetail>>>,
): Promise<PurchaseOrderDetail> {
  const userIds = [row.createdBy, row.approvedBy, row.cancelledBy].filter((id): id is string => Boolean(id));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const nameById = new Map(users.map((user) => [user.id, user.name]));

  return {
    id: row.id,
    poNumber: row.poNumber,
    supplierId: row.supplierId,
    supplierName: row.supplier.companyName,
    supplierAddress: row.supplier.address,
    supplierContactPerson: row.supplier.contactPerson,
    supplierPhone: row.supplier.phone,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouse.name,
    orderDate: row.orderDate.toISOString(),
    expectedDate: row.expectedDate ? row.expectedDate.toISOString() : null,
    status: row.status,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discountAmount),
    taxAmount: Number(row.taxAmount),
    totalAmount: Number(row.totalAmount),
    notes: row.notes,
    createdByName: nameById.get(row.createdBy) ?? "Unknown",
    approvedByName: row.approvedBy ? (nameById.get(row.approvedBy) ?? "Unknown") : null,
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    cancelledByName: row.cancelledBy ? (nameById.get(row.cancelledBy) ?? "Unknown") : null,
    cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      unitSymbol: item.product.unit.symbol,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      tax: Number(item.tax),
      totalPrice: Number(item.totalPrice),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const purchaseOrderService = {
  async list(params: ListParams) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = { search: params.search, status: params.status, supplierId: params.supplierId };

    const [rows, total] = await Promise.all([
      purchaseOrderRepository.findMany({
        skip,
        take: params.pageSize,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
        ...filterArgs,
      }),
      purchaseOrderRepository.count(filterArgs),
    ]);

    return { data: rows.map(toListItem), total, page: params.page, pageSize: params.pageSize };
  },

  async getById(id: string): Promise<PurchaseOrderDetail> {
    const row = await purchaseOrderRepository.findByIdWithDetail(id);
    if (!row) throw new PurchaseOrderServiceError("Purchase order not found.", 404);
    return toDetail(row);
  },

  async create(input: PurchaseOrderInput, actor: ActorContext): Promise<PurchaseOrderDetail> {
    await assertReferencesExist(
      input.supplierId,
      input.warehouseId,
      input.items.map((item) => item.productId),
    );

    const { lineItems, subtotal, discountAmount, taxAmount, totalAmount } = calculateTotals(input.items);
    const poNumber = await purchaseOrderRepository.generatePoNumber();

    const created = await purchaseOrderRepository.createWithItems({
      poNumber,
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      orderDate: new Date(input.orderDate),
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      notes: input.notes || null,
      createdBy: actor.userId,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      items: lineItems,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "purchase-orders",
      entityType: "PurchaseOrder",
      entityId: created.id,
      description: `Created purchase order ${created.poNumber}`,
      ipAddress: actor.ipAddress,
    });

    return toDetail(created);
  },

  async update(id: string, input: PurchaseOrderInput, actor: ActorContext): Promise<PurchaseOrderDetail> {
    const existing = await purchaseOrderRepository.findByIdWithDetail(id);
    if (!existing) throw new PurchaseOrderServiceError("Purchase order not found.", 404);
    if (existing.status !== "DRAFT") {
      throw new PurchaseOrderServiceError("Only draft purchase orders can be edited.", 409);
    }

    await assertReferencesExist(
      input.supplierId,
      input.warehouseId,
      input.items.map((item) => item.productId),
    );

    const { lineItems, subtotal, discountAmount, taxAmount, totalAmount } = calculateTotals(input.items);

    const updated = await purchaseOrderRepository.updateWithItems(id, {
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      orderDate: new Date(input.orderDate),
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      notes: input.notes || null,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      items: lineItems,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "purchase-orders",
      entityType: "PurchaseOrder",
      entityId: id,
      description: `Updated purchase order ${updated.poNumber}`,
      ipAddress: actor.ipAddress,
    });

    return toDetail(updated);
  },

  async approve(id: string, actor: ActorContext): Promise<PurchaseOrderDetail> {
    const existing = await purchaseOrderRepository.findByIdWithDetail(id);
    if (!existing) throw new PurchaseOrderServiceError("Purchase order not found.", 404);
    if (existing.status !== "DRAFT") {
      throw new PurchaseOrderServiceError("Only draft purchase orders can be approved.", 409);
    }

    const approved = await purchaseOrderRepository.approve(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "APPROVE",
      module: "purchase-orders",
      entityType: "PurchaseOrder",
      entityId: id,
      description: `Approved purchase order ${approved.poNumber}`,
      ipAddress: actor.ipAddress,
    });

    return toDetail(approved);
  },

  async cancel(id: string, actor: ActorContext): Promise<PurchaseOrderDetail> {
    const existing = await purchaseOrderRepository.findByIdWithDetail(id);
    if (!existing) throw new PurchaseOrderServiceError("Purchase order not found.", 404);
    if (existing.status !== "DRAFT" && existing.status !== "APPROVED") {
      throw new PurchaseOrderServiceError("Only draft or approved purchase orders can be cancelled.", 409);
    }

    const cancelled = await purchaseOrderRepository.cancel(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CANCEL",
      module: "purchase-orders",
      entityType: "PurchaseOrder",
      entityId: id,
      description: `Cancelled purchase order ${cancelled.poNumber}`,
      ipAddress: actor.ipAddress,
    });

    return toDetail(cancelled);
  },

  async remove(id: string, actor: ActorContext) {
    const existing = await purchaseOrderRepository.findByIdWithDetail(id);
    if (!existing) throw new PurchaseOrderServiceError("Purchase order not found.", 404);
    if (existing.status !== "DRAFT") {
      throw new PurchaseOrderServiceError("Only draft purchase orders can be deleted.", 409);
    }

    await purchaseOrderRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "purchase-orders",
      entityType: "PurchaseOrder",
      entityId: id,
      description: `Deleted purchase order ${existing.poNumber}`,
      ipAddress: actor.ipAddress,
    });
  },

  async getReceivableOptions(): Promise<PurchaseOrderReceivableOption[]> {
    const rows = await purchaseOrderRepository.findApprovedOptions();
    return rows.map((row) => ({ id: row.id, poNumber: row.poNumber, supplierName: row.supplier.companyName }));
  },

  async getReceivingDetail(id: string): Promise<ReceivablePurchaseOrder> {
    const row = await purchaseOrderRepository.findByIdForReceiving(id);
    if (!row) throw new PurchaseOrderServiceError("Approved purchase order not found.", 404);

    return {
      id: row.id,
      poNumber: row.poNumber,
      supplierName: row.supplier.companyName,
      warehouseId: row.warehouseId,
      warehouseName: row.warehouse.name,
      items: row.items
        .map((item) => {
          const previouslyReceivedQuantity = item.grnItems.reduce(
            (sum, grnItem) => sum + Number(grnItem.receivedQuantity),
            0,
          );
          const orderedQuantity = Number(item.quantity);
          return {
            purchaseItemId: item.id,
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            unitSymbol: item.product.unit.symbol,
            orderedQuantity,
            previouslyReceivedQuantity,
            remainingQuantity: Math.max(0, round2(orderedQuantity - previouslyReceivedQuantity)),
            unitPrice: Number(item.unitPrice),
          };
        })
        // Items already fully received in a prior GRN have nothing left to
        // receive against this PO — leaving them in would let someone
        // re-receive stock that's already accounted for.
        .filter((item) => item.remainingQuantity > 0),
    };
  },
};
