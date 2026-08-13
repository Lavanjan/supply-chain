import { prisma } from "@/lib/db/prisma";
import type { DeliveryStatus, Prisma } from "@/lib/generated/prisma/client";

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  status?: DeliveryStatus;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

function buildWhere(params: Pick<FindManyParams, "search" | "status">): Prisma.DeliveryWhereInput {
  return {
    isDeleted: false,
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { deliveryNumber: { contains: params.search, mode: "insensitive" } },
            { customer: { companyName: { contains: params.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

const SORTABLE_FIELDS = new Set(["deliveryNumber", "scheduledDate", "status", "createdAt"]);

function buildOrderBy(sortField?: string, sortOrder?: "ascend" | "descend"): Prisma.DeliveryOrderByWithRelationInput {
  if (sortField && SORTABLE_FIELDS.has(sortField)) {
    return { [sortField]: sortOrder === "descend" ? "desc" : "asc" };
  }
  return { createdAt: "desc" };
}

const detailInclude = {
  customer: { select: { companyName: true, customerType: true } },
  warehouse: { select: { id: true, name: true } },
  vehicle: { select: { id: true, plateNumber: true } },
  driver: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true, unit: { select: { symbol: true } } } },
    },
  },
} satisfies Prisma.DeliveryInclude;

export const deliveryRepository = {
  findMany(params: FindManyParams) {
    return prisma.delivery.findMany({
      where: buildWhere(params),
      orderBy: buildOrderBy(params.sortField, params.sortOrder),
      skip: params.skip,
      take: params.take,
      include: {
        customer: { select: { companyName: true } },
        warehouse: { select: { name: true } },
        vehicle: { select: { plateNumber: true } },
        driver: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });
  },

  count(params: Pick<FindManyParams, "search" | "status">) {
    return prisma.delivery.count({ where: buildWhere(params) });
  },

  findByIdWithDetail(id: string) {
    return prisma.delivery.findFirst({ where: { id, isDeleted: false }, include: detailInclude });
  },

  async generateDeliveryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const yearPrefix = `DEL-${year}-`;
    const count = await prisma.delivery.count({ where: { deliveryNumber: { startsWith: yearPrefix } } });
    return `${yearPrefix}${String(count + 1).padStart(4, "0")}`;
  },

  createWithItems(data: {
    deliveryNumber: string;
    customerId: string;
    warehouseId: string;
    vehicleId: string | null;
    driverId: string | null;
    scheduledDate: Date;
    deliveryAddress: string | null;
    notes: string | null;
    createdBy: string;
    totalAmount: number;
    items: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[];
  }) {
    return prisma.delivery.create({
      data: {
        deliveryNumber: data.deliveryNumber,
        customerId: data.customerId,
        warehouseId: data.warehouseId,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        scheduledDate: data.scheduledDate,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        createdBy: data.createdBy,
        totalAmount: data.totalAmount,
        items: { create: data.items },
      },
      include: detailInclude,
    });
  },

  async updateWithItems(
    id: string,
    data: {
      customerId: string;
      warehouseId: string;
      vehicleId: string | null;
      driverId: string | null;
      scheduledDate: Date;
      deliveryAddress: string | null;
      notes: string | null;
      totalAmount: number;
      items: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.deliveryItem.deleteMany({ where: { deliveryId: id } });
      return tx.delivery.update({
        where: { id },
        data: {
          customerId: data.customerId,
          warehouseId: data.warehouseId,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          scheduledDate: data.scheduledDate,
          deliveryAddress: data.deliveryAddress,
          notes: data.notes,
          totalAmount: data.totalAmount,
          items: { create: data.items },
        },
        include: detailInclude,
      });
    });
  },

  markDelivered(id: string) {
    return prisma.delivery.update({
      where: { id },
      data: { status: "DELIVERED", deliveredDate: new Date() },
      include: detailInclude,
    });
  },

  cancel(id: string) {
    return prisma.delivery.update({ where: { id }, data: { status: "CANCELLED" }, include: detailInclude });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.delivery.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy } });
  },
};
