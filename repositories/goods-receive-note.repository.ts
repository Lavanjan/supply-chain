import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  warehouseId?: string;
}

function buildWhere(params: Pick<FindManyParams, "search" | "warehouseId">): Prisma.GoodsReceiveNoteWhereInput {
  return {
    isDeleted: false,
    ...(params.warehouseId ? { warehouseId: params.warehouseId } : {}),
    ...(params.search
      ? {
          OR: [
            { grnNumber: { contains: params.search, mode: "insensitive" } },
            { purchaseOrder: { poNumber: { contains: params.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

const detailInclude = {
  purchaseOrder: { select: { poNumber: true, supplier: { select: { companyName: true } } } },
  warehouse: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true, unit: { select: { symbol: true } } } },
    },
  },
} satisfies Prisma.GoodsReceiveNoteInclude;

export const goodsReceiveNoteRepository = {
  findMany(params: FindManyParams) {
    return prisma.goodsReceiveNote.findMany({
      where: buildWhere(params),
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
      include: {
        purchaseOrder: { select: { poNumber: true, supplier: { select: { companyName: true } } } },
        warehouse: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });
  },

  count(params: Pick<FindManyParams, "search" | "warehouseId">) {
    return prisma.goodsReceiveNote.count({ where: buildWhere(params) });
  },

  findByIdWithDetail(id: string) {
    return prisma.goodsReceiveNote.findFirst({ where: { id, isDeleted: false }, include: detailInclude });
  },

  async generateGrnNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const yearPrefix = `GRN-${year}-`;
    const count = await prisma.goodsReceiveNote.count({ where: { grnNumber: { startsWith: yearPrefix } } });
    return `${yearPrefix}${String(count + 1).padStart(4, "0")}`;
  },
};
