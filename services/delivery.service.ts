import { prisma } from "@/lib/db/prisma";
import { deliveryRepository } from "@/repositories/delivery.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import { performStockOutFifo } from "@/services/inventory.service";
import type { DeliveryInput } from "@/lib/validations/delivery.schema";
import type { PaginationParams } from "@/types/api.types";
import type { DeliveryDetail, DeliveryListItem } from "@/types/delivery.types";
import type { DeliveryStatus, Prisma } from "@/lib/generated/prisma/client";

export class DeliveryServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface ActorContext {
  userId: string;
  userName: string;
  ipAddress: string | null;
}

type ListRow = Prisma.DeliveryGetPayload<{
  include: {
    customer: { select: { companyName: true } };
    warehouse: { select: { name: true } };
    vehicle: { select: { plateNumber: true } };
    driver: { select: { name: true } };
    _count: { select: { items: true } };
  };
}>;

function toListItem(row: ListRow): DeliveryListItem {
  return {
    id: row.id,
    deliveryNumber: row.deliveryNumber,
    customerName: row.customer.companyName,
    warehouseName: row.warehouse.name,
    vehiclePlateNumber: row.vehicle?.plateNumber ?? null,
    driverName: row.driver?.name ?? null,
    scheduledDate: row.scheduledDate.toISOString(),
    deliveredDate: row.deliveredDate ? row.deliveredDate.toISOString() : null,
    status: row.status,
    itemCount: row._count.items,
  };
}

async function toDetail(
  row: NonNullable<Awaited<ReturnType<typeof deliveryRepository.findByIdWithDetail>>>,
): Promise<DeliveryDetail> {
  const creator = await prisma.user.findUnique({ where: { id: row.createdBy }, select: { name: true } });

  return {
    id: row.id,
    deliveryNumber: row.deliveryNumber,
    customerId: row.customerId,
    customerName: row.customer.companyName,
    customerType: row.customer.customerType,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouse.name,
    vehicleId: row.vehicleId,
    vehiclePlateNumber: row.vehicle?.plateNumber ?? null,
    driverId: row.driverId,
    driverName: row.driver?.name ?? null,
    scheduledDate: row.scheduledDate.toISOString(),
    deliveredDate: row.deliveredDate ? row.deliveredDate.toISOString() : null,
    status: row.status,
    deliveryAddress: row.deliveryAddress,
    notes: row.notes,
    createdByName: creator?.name ?? "Unknown",
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      unitSymbol: item.product.unit.symbol,
      quantity: Number(item.quantity),
    })),
    createdAt: row.createdAt.toISOString(),
  };
}

async function assertReferencesExist(input: DeliveryInput) {
  const productIds = input.items.map((item) => item.productId);
  const [customer, warehouse, vehicle, driver, products] = await Promise.all([
    prisma.customer.findFirst({ where: { id: input.customerId, isDeleted: false } }),
    prisma.warehouse.findFirst({ where: { id: input.warehouseId, isDeleted: false } }),
    input.vehicleId ? prisma.vehicle.findFirst({ where: { id: input.vehicleId, isDeleted: false } }) : null,
    input.driverId ? prisma.driver.findFirst({ where: { id: input.driverId, isDeleted: false } }) : null,
    prisma.product.findMany({ where: { id: { in: productIds }, isDeleted: false }, select: { id: true } }),
  ]);

  if (!customer) throw new DeliveryServiceError("Customer not found.", 422);
  if (!warehouse) throw new DeliveryServiceError("Warehouse not found.", 422);
  if (input.vehicleId && !vehicle) throw new DeliveryServiceError("Vehicle not found.", 422);
  if (input.driverId && !driver) throw new DeliveryServiceError("Driver not found.", 422);
  if (products.length !== new Set(productIds).size) {
    throw new DeliveryServiceError("One or more selected products were not found.", 422);
  }
}

async function assertSufficientStock(input: DeliveryInput) {
  const requestedByProduct = new Map<string, number>();
  for (const item of input.items) {
    requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  const productIds = [...requestedByProduct.keys()];
  const rows = await prisma.inventory.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, warehouseId: input.warehouseId },
    _sum: { quantity: true },
  });
  const availableByProduct = new Map(rows.map((row) => [row.productId, Number(row._sum.quantity ?? 0)]));

  for (const [productId, requested] of requestedByProduct) {
    const available = availableByProduct.get(productId) ?? 0;
    if (requested > available) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
      throw new DeliveryServiceError(
        `Insufficient stock for ${product?.name ?? "selected product"} — only ${available} available, ${requested} requested.`,
        409,
      );
    }
  }
}

export const deliveryService = {
  async list(params: PaginationParams & { status?: DeliveryStatus }) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = { search: params.search, status: params.status };

    const [rows, total] = await Promise.all([
      deliveryRepository.findMany({ skip, take: params.pageSize, ...filterArgs }),
      deliveryRepository.count(filterArgs),
    ]);

    return { data: rows.map(toListItem), total, page: params.page, pageSize: params.pageSize };
  },

  async getById(id: string): Promise<DeliveryDetail> {
    const row = await deliveryRepository.findByIdWithDetail(id);
    if (!row) throw new DeliveryServiceError("Delivery not found.", 404);
    return toDetail(row);
  },

  async create(input: DeliveryInput, actor: ActorContext): Promise<DeliveryDetail> {
    await assertReferencesExist(input);
    await assertSufficientStock(input);

    const deliveryNumber = await deliveryRepository.generateDeliveryNumber();
    const created = await deliveryRepository.createWithItems({
      deliveryNumber,
      customerId: input.customerId,
      warehouseId: input.warehouseId,
      vehicleId: input.vehicleId || null,
      driverId: input.driverId || null,
      scheduledDate: new Date(input.scheduledDate),
      deliveryAddress: input.deliveryAddress || null,
      notes: input.notes || null,
      createdBy: actor.userId,
      items: input.items,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "deliveries",
      entityType: "Delivery",
      entityId: created.id,
      description: `Scheduled delivery ${created.deliveryNumber}`,
      ipAddress: actor.ipAddress,
    });

    return toDetail(created);
  },

  async update(id: string, input: DeliveryInput, actor: ActorContext): Promise<DeliveryDetail> {
    const existing = await deliveryRepository.findByIdWithDetail(id);
    if (!existing) throw new DeliveryServiceError("Delivery not found.", 404);
    if (existing.status !== "PENDING") {
      throw new DeliveryServiceError("Only pending deliveries can be edited.", 409);
    }

    await assertReferencesExist(input);
    await assertSufficientStock(input);

    const updated = await deliveryRepository.updateWithItems(id, {
      customerId: input.customerId,
      warehouseId: input.warehouseId,
      vehicleId: input.vehicleId || null,
      driverId: input.driverId || null,
      scheduledDate: new Date(input.scheduledDate),
      deliveryAddress: input.deliveryAddress || null,
      notes: input.notes || null,
      items: input.items,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "deliveries",
      entityType: "Delivery",
      entityId: id,
      description: `Updated delivery ${updated.deliveryNumber}`,
      ipAddress: actor.ipAddress,
    });

    return toDetail(updated);
  },

  async markDelivered(id: string, actor: ActorContext): Promise<DeliveryDetail> {
    const existing = await deliveryRepository.findByIdWithDetail(id);
    if (!existing) throw new DeliveryServiceError("Delivery not found.", 404);
    if (existing.status !== "PENDING") {
      throw new DeliveryServiceError("Only pending deliveries can be marked as delivered.", 409);
    }

    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await performStockOutFifo(tx, {
          productId: item.productId,
          warehouseId: existing.warehouseId,
          quantity: Number(item.quantity),
          referenceType: "DELIVERY",
          referenceId: existing.id,
          notes: `Delivered via ${existing.deliveryNumber}`,
          performedById: actor.userId,
        });
      }

      await tx.delivery.update({ where: { id }, data: { status: "DELIVERED", deliveredDate: new Date() } });
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "deliveries",
      entityType: "Delivery",
      entityId: id,
      description: `Marked delivery ${existing.deliveryNumber} as delivered`,
      ipAddress: actor.ipAddress,
    });

    return this.getById(id);
  },

  async cancel(id: string, actor: ActorContext): Promise<DeliveryDetail> {
    const existing = await deliveryRepository.findByIdWithDetail(id);
    if (!existing) throw new DeliveryServiceError("Delivery not found.", 404);
    if (existing.status !== "PENDING") {
      throw new DeliveryServiceError("Only pending deliveries can be cancelled.", 409);
    }

    const cancelled = await deliveryRepository.cancel(id);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CANCEL",
      module: "deliveries",
      entityType: "Delivery",
      entityId: id,
      description: `Cancelled delivery ${cancelled.deliveryNumber}`,
      ipAddress: actor.ipAddress,
    });

    return toDetail(cancelled);
  },

  async remove(id: string, actor: ActorContext) {
    const existing = await deliveryRepository.findByIdWithDetail(id);
    if (!existing) throw new DeliveryServiceError("Delivery not found.", 404);
    if (existing.status !== "PENDING") {
      throw new DeliveryServiceError("Only pending deliveries can be deleted.", 409);
    }

    await deliveryRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "deliveries",
      entityType: "Delivery",
      entityId: id,
      description: `Deleted delivery ${existing.deliveryNumber}`,
      ipAddress: actor.ipAddress,
    });
  },
};
