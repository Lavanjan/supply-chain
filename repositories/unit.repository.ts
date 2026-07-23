import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

function buildWhere(search?: string): Prisma.UnitWhereInput {
  return {
    isDeleted: false,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { symbol: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

const SORTABLE_FIELDS = new Set(["name", "symbol", "isActive", "createdAt", "updatedAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.UnitOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

export const unitRepository = {
  findMany({ skip, take, search, sortField, sortOrder }: FindManyParams) {
    return prisma.unit.findMany({
      where: buildWhere(search),
      orderBy: buildOrderBy(sortField, sortOrder),
      skip,
      take,
      include: { _count: { select: { products: true } } },
    });
  },

  count(search?: string) {
    return prisma.unit.count({ where: buildWhere(search) });
  },

  findById(id: string) {
    return prisma.unit.findFirst({ where: { id, isDeleted: false } });
  },

  findByName(name: string, excludeId?: string) {
    return prisma.unit.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  create(data: { name: string; symbol: string; isActive: boolean }) {
    return prisma.unit.create({ data });
  },

  update(id: string, data: { name: string; symbol: string; isActive: boolean }) {
    return prisma.unit.update({ where: { id }, data });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.unit.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy },
    });
  },

  countActiveProducts(unitId: string) {
    return prisma.product.count({ where: { unitId, isDeleted: false } });
  },

  findActiveOptions() {
    return prisma.unit.findMany({
      where: { isDeleted: false, isActive: true },
      select: { id: true, name: true, symbol: true },
      orderBy: { name: "asc" },
    });
  },
};
