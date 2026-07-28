import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

function buildWhere(search?: string): Prisma.WarehouseWhereInput {
  return {
    isDeleted: false,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

const SORTABLE_FIELDS = new Set(["name", "code", "isActive", "createdAt", "updatedAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.WarehouseOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

export const warehouseRepository = {
  findMany(params: FindManyParams) {
    return prisma.warehouse.findMany({
      where: buildWhere(params.search),
      orderBy: buildOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: { _count: { select: { inventories: true } } },
    });
  },

  count(search?: string) {
    return prisma.warehouse.count({ where: buildWhere(search) });
  },

  findById(id: string) {
    return prisma.warehouse.findFirst({ where: { id, isDeleted: false } });
  },

  findByCode(code: string, excludeId?: string) {
    return prisma.warehouse.findFirst({
      where: {
        code: { equals: code, mode: "insensitive" },
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  create(data: Prisma.WarehouseCreateInput) {
    return prisma.warehouse.create({ data });
  },

  update(id: string, data: Prisma.WarehouseUpdateInput) {
    return prisma.warehouse.update({ where: { id }, data });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.warehouse.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy },
    });
  },

  countInventoryRows(warehouseId: string) {
    return prisma.inventory.count({ where: { warehouseId, quantity: { gt: 0 } } });
  },

  findActiveOptions() {
    return prisma.warehouse.findMany({
      where: { isDeleted: false, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  },
};
