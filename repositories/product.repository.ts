import { prisma } from "@/lib/db/prisma";
import type { Prisma, ProductStatus } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
  categoryId?: string;
  unitId?: string;
  status?: ProductStatus;
}

function buildWhere(params: Pick<FindManyParams, "search" | "categoryId" | "unitId" | "status">): Prisma.ProductWhereInput {
  return {
    isDeleted: false,
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.unitId ? { unitId: params.unitId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { sku: { contains: params.search, mode: "insensitive" } },
            { barcode: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

const SORTABLE_FIELDS = new Set(["name", "sku", "currentStock", "status", "createdAt", "updatedAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.ProductOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

const includeRelations = {
  category: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true, symbol: true } },
} satisfies Prisma.ProductInclude;

export const productRepository = {
  findMany(params: FindManyParams) {
    return prisma.product.findMany({
      where: buildWhere(params),
      orderBy: buildOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: includeRelations,
    });
  },

  count(params: Pick<FindManyParams, "search" | "categoryId" | "unitId" | "status">) {
    return prisma.product.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.product.findFirst({ where: { id, isDeleted: false }, include: includeRelations });
  },

  findBySku(sku: string, excludeId?: string) {
    return prisma.product.findFirst({
      where: { sku: { equals: sku, mode: "insensitive" }, isDeleted: false, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
  },

  findByBarcode(barcode: string, excludeId?: string) {
    return prisma.product.findFirst({
      where: { barcode: { equals: barcode, mode: "insensitive" }, isDeleted: false, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
  },

  create(data: Prisma.ProductUncheckedCreateInput) {
    return prisma.product.create({ data, include: includeRelations });
  },

  update(id: string, data: Prisma.ProductUncheckedUpdateInput) {
    return prisma.product.update({ where: { id }, data, include: includeRelations });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.product.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy },
    });
  },

  findActiveOptionsForSelect() {
    return prisma.product.findMany({
      where: { isDeleted: false, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: { select: { symbol: true } },
      },
      orderBy: { name: "asc" },
    });
  },
};
