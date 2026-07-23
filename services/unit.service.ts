import { unitRepository } from "@/repositories/unit.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { UnitInput } from "@/lib/validations/unit.schema";
import type { PaginationParams } from "@/types/api.types";

export class UnitServiceError extends Error {
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

export const unitService = {
  async list(params: PaginationParams) {
    const skip = (params.page - 1) * params.pageSize;
    const [data, total] = await Promise.all([
      unitRepository.findMany({
        skip,
        take: params.pageSize,
        search: params.search,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
      }),
      unitRepository.count(params.search),
    ]);

    return {
      data: data.map((unit) => ({
        id: unit.id,
        name: unit.name,
        symbol: unit.symbol,
        isActive: unit.isActive,
        productCount: unit._count.products,
        createdAt: unit.createdAt.toISOString(),
        updatedAt: unit.updatedAt.toISOString(),
      })),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  async create(input: UnitInput, actor: ActorContext) {
    const existing = await unitRepository.findByName(input.name);
    if (existing) throw new UnitServiceError("A unit with this name already exists.", 409);

    const unit = await unitRepository.create(input);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "units",
      entityType: "Unit",
      entityId: unit.id,
      description: `Created unit "${unit.name}"`,
      ipAddress: actor.ipAddress,
    });

    return unit;
  },

  async update(id: string, input: UnitInput, actor: ActorContext) {
    const unit = await unitRepository.findById(id);
    if (!unit) throw new UnitServiceError("Unit not found.", 404);

    const existing = await unitRepository.findByName(input.name, id);
    if (existing) throw new UnitServiceError("A unit with this name already exists.", 409);

    const updated = await unitRepository.update(id, input);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "units",
      entityType: "Unit",
      entityId: id,
      description: `Updated unit "${updated.name}"`,
      oldValues: { name: unit.name, symbol: unit.symbol, isActive: unit.isActive },
      newValues: { name: updated.name, symbol: updated.symbol, isActive: updated.isActive },
      ipAddress: actor.ipAddress,
    });

    return updated;
  },

  async remove(id: string, actor: ActorContext) {
    const unit = await unitRepository.findById(id);
    if (!unit) throw new UnitServiceError("Unit not found.", 404);

    const productCount = await unitRepository.countActiveProducts(id);
    if (productCount > 0) {
      throw new UnitServiceError(`Cannot delete "${unit.name}" — it is used by ${productCount} product(s).`, 409);
    }

    await unitRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "units",
      entityType: "Unit",
      entityId: id,
      description: `Deleted unit "${unit.name}"`,
      ipAddress: actor.ipAddress,
    });
  },
};
