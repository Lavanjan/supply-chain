import { prisma } from "@/lib/db/prisma";
import type { Prisma, VehicleStatus } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  status?: VehicleStatus;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

function buildWhere(params: Pick<FindManyParams, "search" | "status">): Prisma.VehicleWhereInput {
  return {
    isDeleted: false,
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { plateNumber: { contains: params.search, mode: "insensitive" } },
            { type: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

const SORTABLE_FIELDS = new Set(["plateNumber", "type", "status", "createdAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.VehicleOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

export const vehicleRepository = {
  findMany(params: FindManyParams) {
    return prisma.vehicle.findMany({
      where: buildWhere(params),
      orderBy: buildOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: { _count: { select: { deliveries: true } } },
    });
  },

  count(params: Pick<FindManyParams, "search" | "status">) {
    return prisma.vehicle.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.vehicle.findFirst({ where: { id, isDeleted: false } });
  },

  findByPlateNumber(plateNumber: string, excludeId?: string) {
    return prisma.vehicle.findFirst({
      where: {
        plateNumber: { equals: plateNumber, mode: "insensitive" },
        isDeleted: false,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  create(data: Prisma.VehicleCreateInput) {
    return prisma.vehicle.create({ data });
  },

  update(id: string, data: Prisma.VehicleUpdateInput) {
    return prisma.vehicle.update({ where: { id }, data });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.vehicle.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy } });
  },

  countActiveDeliveries(vehicleId: string) {
    return prisma.delivery.count({ where: { vehicleId, isDeleted: false, status: "PENDING" } });
  },

  findActiveOptions() {
    return prisma.vehicle.findMany({
      where: { isDeleted: false, status: "ACTIVE" },
      select: { id: true, plateNumber: true, type: true },
      orderBy: { plateNumber: "asc" },
    });
  },
};
