import { warehouseRepository } from "@/repositories/warehouse.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { WarehouseInput } from "@/lib/validations/warehouse.schema";
import type { PaginationParams } from "@/types/api.types";

export class WarehouseServiceError extends Error {
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

function toListItem(warehouse: {
  id: string;
  name: string;
  code: string;
  address: string | null;
  managerName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { inventories: number };
}) {
  return {
    id: warehouse.id,
    name: warehouse.name,
    code: warehouse.code,
    address: warehouse.address,
    managerName: warehouse.managerName,
    phone: warehouse.phone,
    isActive: warehouse.isActive,
    inventoryCount: warehouse._count.inventories,
    createdAt: warehouse.createdAt.toISOString(),
    updatedAt: warehouse.updatedAt.toISOString(),
  };
}

function toWriteData(input: WarehouseInput) {
  return {
    name: input.name,
    code: input.code,
    address: input.address || null,
    managerName: input.managerName || null,
    phone: input.phone || null,
    isActive: input.isActive,
  };
}

export const warehouseService = {
  async list(params: PaginationParams) {
    const skip = (params.page - 1) * params.pageSize;
    const [warehouses, total] = await Promise.all([
      warehouseRepository.findMany({
        skip,
        take: params.pageSize,
        search: params.search,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
      }),
      warehouseRepository.count(params.search),
    ]);

    return {
      data: warehouses.map((warehouse) => toListItem(warehouse)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  async getOptions() {
    return warehouseRepository.findActiveOptions();
  },

  async create(input: WarehouseInput, actor: ActorContext) {
    const existing = await warehouseRepository.findByCode(input.code);
    if (existing) throw new WarehouseServiceError("A warehouse with this code already exists.", 409);

    const warehouse = await warehouseRepository.create(toWriteData(input));

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "warehouses",
      entityType: "Warehouse",
      entityId: warehouse.id,
      description: `Created warehouse "${warehouse.name}" (${warehouse.code})`,
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...warehouse, _count: { inventories: 0 } });
  },

  async update(id: string, input: WarehouseInput, actor: ActorContext) {
    const existing = await warehouseRepository.findById(id);
    if (!existing) throw new WarehouseServiceError("Warehouse not found.", 404);

    const existingCode = await warehouseRepository.findByCode(input.code, id);
    if (existingCode) throw new WarehouseServiceError("A warehouse with this code already exists.", 409);

    const updated = await warehouseRepository.update(id, toWriteData(input));
    const inventoryCount = await warehouseRepository.countInventoryRows(id);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "warehouses",
      entityType: "Warehouse",
      entityId: id,
      description: `Updated warehouse "${updated.name}"`,
      oldValues: { name: existing.name, code: existing.code, isActive: existing.isActive },
      newValues: { name: updated.name, code: updated.code, isActive: updated.isActive },
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...updated, _count: { inventories: inventoryCount } });
  },

  async remove(id: string, actor: ActorContext) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) throw new WarehouseServiceError("Warehouse not found.", 404);

    const inventoryCount = await warehouseRepository.countInventoryRows(id);
    if (inventoryCount > 0) {
      throw new WarehouseServiceError(
        `Cannot delete "${warehouse.name}" — it still holds stock for ${inventoryCount} item(s).`,
        409,
      );
    }

    await warehouseRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "warehouses",
      entityType: "Warehouse",
      entityId: id,
      description: `Deleted warehouse "${warehouse.name}"`,
      ipAddress: actor.ipAddress,
    });
  },
};
