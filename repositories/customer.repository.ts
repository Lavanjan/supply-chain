import { prisma } from "@/lib/db/prisma";
import type { CustomerType, PartnerStatus, Prisma } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
  status?: PartnerStatus;
  customerType?: CustomerType;
}

function buildWhere(
  params: Pick<FindManyParams, "search" | "status" | "customerType">,
): Prisma.CustomerWhereInput {
  return {
    isDeleted: false,
    ...(params.status ? { status: params.status } : {}),
    ...(params.customerType ? { customerType: params.customerType } : {}),
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

const SORTABLE_FIELDS = new Set(["companyName", "customerType", "status", "createdAt", "updatedAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.CustomerOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

export const customerRepository = {
  findMany(params: FindManyParams) {
    return prisma.customer.findMany({
      where: buildWhere(params),
      orderBy: buildOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: { _count: { select: { deliveries: true } } },
    });
  },

  count(params: Pick<FindManyParams, "search" | "status" | "customerType">) {
    return prisma.customer.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.customer.findFirst({ where: { id, isDeleted: false } });
  },

  create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  },

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.customer.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy },
    });
  },

  countDeliveries(customerId: string) {
    return prisma.delivery.count({ where: { customerId, isDeleted: false } });
  },

  findActiveOptions() {
    return prisma.customer.findMany({
      where: { isDeleted: false, status: "ACTIVE" },
      select: { id: true, companyName: true, customerType: true },
      orderBy: { companyName: "asc" },
    });
  },
};
