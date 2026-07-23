import { prisma } from "@/lib/db/prisma";
import type { PartnerStatus, Prisma } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
  status?: PartnerStatus;
}

function buildWhere(params: Pick<FindManyParams, "search" | "status">): Prisma.SupplierWhereInput {
  return {
    isDeleted: false,
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { companyName: { contains: params.search, mode: "insensitive" } },
            { contactPerson: { contains: params.search, mode: "insensitive" } },
            { phone: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

const SORTABLE_FIELDS = new Set(["companyName", "contactPerson", "status", "createdAt", "updatedAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.SupplierOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

export const supplierRepository = {
  findMany(params: FindManyParams) {
    return prisma.supplier.findMany({
      where: buildWhere(params),
      orderBy: buildOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: { _count: { select: { purchaseOrders: true } } },
    });
  },

  count(params: Pick<FindManyParams, "search" | "status">) {
    return prisma.supplier.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.supplier.findFirst({ where: { id, isDeleted: false } });
  },

  create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({ data });
  },

  update(id: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({ where: { id }, data });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.supplier.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy },
    });
  },

  countPurchaseOrders(supplierId: string) {
    return prisma.purchaseOrder.count({ where: { supplierId, isDeleted: false } });
  },

  findActiveOptions() {
    return prisma.supplier.findMany({
      where: { isDeleted: false, status: "ACTIVE" },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    });
  },
};
