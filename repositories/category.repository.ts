import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

function buildWhere(search?: string): Prisma.CategoryWhereInput {
  return {
    isDeleted: false,
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };
}

const SORTABLE_FIELDS = new Set(["name", "isActive", "createdAt", "updatedAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.CategoryOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

export const categoryRepository = {
  findMany({ skip, take, search, sortField, sortOrder }: FindManyParams) {
    return prisma.category.findMany({
      where: buildWhere(search),
      orderBy: buildOrderBy(sortField, sortOrder),
      skip,
      take,
      include: { _count: { select: { products: true } } },
    });
  },

  count(search?: string) {
    return prisma.category.count({ where: buildWhere(search) });
  },

  findById(id: string) {
    return prisma.category.findFirst({ where: { id, isDeleted: false } });
  },

  findByName(name: string, excludeId?: string) {
    return prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  create(data: { name: string; description?: string; isActive: boolean }) {
    return prisma.category.create({ data });
  },

  update(id: string, data: { name: string; description?: string; isActive: boolean }) {
    return prisma.category.update({ where: { id }, data });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.category.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy },
    });
  },

  countActiveProducts(categoryId: string) {
    return prisma.product.count({ where: { categoryId, isDeleted: false } });
  },

  findActiveOptions() {
    return prisma.category.findMany({
      where: { isDeleted: false, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },
};
