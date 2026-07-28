import { prisma } from "@/lib/db/prisma";
import type { DriverStatus, Prisma } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  status?: DriverStatus;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

function buildWhere(params: Pick<FindManyParams, "search" | "status">): Prisma.DriverWhereInput {
  return {
    isDeleted: false,
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { licenseNumber: { contains: params.search, mode: "insensitive" } },
            { phone: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

const SORTABLE_FIELDS = new Set(["name", "licenseNumber", "status", "createdAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.DriverOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

export const driverRepository = {
  findMany(params: FindManyParams) {
    return prisma.driver.findMany({
      where: buildWhere(params),
      orderBy: buildOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: { _count: { select: { deliveries: true } } },
    });
  },

  count(params: Pick<FindManyParams, "search" | "status">) {
    return prisma.driver.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.driver.findFirst({ where: { id, isDeleted: false } });
  },

  findByLicenseNumber(licenseNumber: string, excludeId?: string) {
    return prisma.driver.findFirst({
      where: {
        licenseNumber: { equals: licenseNumber, mode: "insensitive" },
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  create(data: Prisma.DriverCreateInput) {
    return prisma.driver.create({ data });
  },

  update(id: string, data: Prisma.DriverUpdateInput) {
    return prisma.driver.update({ where: { id }, data });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.driver.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy } });
  },

  countActiveDeliveries(driverId: string) {
    return prisma.delivery.count({ where: { driverId, isDeleted: false, status: "PENDING" } });
  },

  findActiveOptions() {
    return prisma.driver.findMany({
      where: { isDeleted: false, status: "ACTIVE" },
      select: { id: true, name: true, licenseNumber: true },
      orderBy: { name: "asc" },
    });
  },
};
