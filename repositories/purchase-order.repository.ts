import { prisma } from "@/lib/db/prisma";
import type { Prisma, PurchaseOrderStatus } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

function buildWhere(
  params: Pick<FindManyParams, "search" | "status" | "supplierId">,
): Prisma.PurchaseOrderWhereInput {
  return {
    isDeleted: false,
    ...(params.status ? { status: params.status } : {}),
    ...(params.supplierId ? { supplierId: params.supplierId } : {}),
    ...(params.search
      ? {
          OR: [
            { poNumber: { contains: params.search, mode: "insensitive" } },
            { supplier: { companyName: { contains: params.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

const SORTABLE_FIELDS = new Set(["poNumber", "orderDate", "status", "createdAt"]);

function buildOrderBy(
  sortField?: string,
  sortOrder?: "ascend" | "descend",
): Prisma.PurchaseOrderOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

const detailInclude = {
  supplier: true,
  warehouse: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true, unit: { select: { symbol: true } } } },
    },
  },
} satisfies Prisma.PurchaseOrderInclude;

export const purchaseOrderRepository = {
  findMany(params: FindManyParams) {
    return prisma.purchaseOrder.findMany({
      where: buildWhere(params),
      orderBy: buildOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: {
        supplier: { select: { companyName: true } },
        warehouse: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });
  },

  count(params: Pick<FindManyParams, "search" | "status" | "supplierId">) {
    return prisma.purchaseOrder.count({ where: buildWhere(params) });
  },

  findByIdWithDetail(id: string) {
    return prisma.purchaseOrder.findFirst({
      where: { id, isDeleted: false },
      include: detailInclude,
    });
  },

  async generatePoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const yearPrefix = `PO-${year}-`;
    const count = await prisma.purchaseOrder.count({ where: { poNumber: { startsWith: yearPrefix } } });
    return `${yearPrefix}${String(count + 1).padStart(4, "0")}`;
  },

  async createWithItems(data: {
    poNumber: string;
    supplierId: string;
    warehouseId: string;
    orderDate: Date;
    expectedDate: Date | null;
    notes: string | null;
    createdBy: string;
    items: { productId: string; quantity: number }[];
  }) {
    return prisma.purchaseOrder.create({
      data: {
        poNumber: data.poNumber,
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        orderDate: data.orderDate,
        expectedDate: data.expectedDate,
        notes: data.notes,
        createdBy: data.createdBy,
        items: { create: data.items },
      },
      include: detailInclude,
    });
  },

  async updateWithItems(
    id: string,
    data: {
      supplierId: string;
      warehouseId: string;
      orderDate: Date;
      expectedDate: Date | null;
      notes: string | null;
      items: { productId: string; quantity: number }[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({ where: { purchaseOrderId: id } });
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: data.supplierId,
          warehouseId: data.warehouseId,
          orderDate: data.orderDate,
          expectedDate: data.expectedDate,
          notes: data.notes,
          items: { create: data.items },
        },
        include: detailInclude,
      });
    });
  },

  approve(id: string, approvedBy: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
      include: detailInclude,
    });
  },

  cancel(id: string, cancelledBy: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED", cancelledBy, cancelledAt: new Date() },
      include: detailInclude,
    });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy },
    });
  },

  findActiveOptions() {
    return prisma.purchaseOrder.findMany({
      where: { isDeleted: false, status: { in: ["DRAFT", "APPROVED"] } },
      select: { id: true, poNumber: true },
      orderBy: { orderDate: "desc" },
    });
  },

  findApprovedOptions() {
    return prisma.purchaseOrder.findMany({
      where: { isDeleted: false, status: "APPROVED" },
      select: { id: true, poNumber: true, supplier: { select: { companyName: true } } },
      orderBy: { orderDate: "desc" },
    });
  },

  findByIdForReceiving(id: string) {
    return prisma.purchaseOrder.findFirst({
      where: { id, isDeleted: false, status: "APPROVED" },
      include: {
        supplier: { select: { companyName: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: { select: { symbol: true } } } },
            grnItems: { select: { receivedQuantity: true } },
          },
        },
      },
    });
  },
};
