import { vehicleRepository } from "@/repositories/vehicle.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { VehicleInput } from "@/lib/validations/vehicle.schema";
import type { PaginationParams } from "@/types/api.types";
import type { VehicleStatus } from "@/lib/generated/prisma/client";

export class VehicleServiceError extends Error {
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

function toListItem(vehicle: {
  id: string;
  plateNumber: string;
  type: string;
  capacity: string | null;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
  _count: { deliveries: number };
}) {
  return {
    id: vehicle.id,
    plateNumber: vehicle.plateNumber,
    type: vehicle.type,
    capacity: vehicle.capacity,
    status: vehicle.status,
    deliveryCount: vehicle._count.deliveries,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}

export const vehicleService = {
  async list(params: PaginationParams & { status?: VehicleStatus }) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = { search: params.search, status: params.status };

    const [vehicles, total] = await Promise.all([
      vehicleRepository.findMany({
        skip,
        take: params.pageSize,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
        ...filterArgs,
      }),
      vehicleRepository.count(filterArgs),
    ]);

    return { data: vehicles.map(toListItem), total, page: params.page, pageSize: params.pageSize };
  },

  async create(input: VehicleInput, actor: ActorContext) {
    const existing = await vehicleRepository.findByPlateNumber(input.plateNumber);
    if (existing) throw new VehicleServiceError("A vehicle with this plate number already exists.", 409);

    const vehicle = await vehicleRepository.create({
      plateNumber: input.plateNumber,
      type: input.type,
      capacity: input.capacity || null,
      status: input.status,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "vehicles",
      entityType: "Vehicle",
      entityId: vehicle.id,
      description: `Created vehicle "${vehicle.plateNumber}"`,
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...vehicle, _count: { deliveries: 0 } });
  },

  async update(id: string, input: VehicleInput, actor: ActorContext) {
    const existing = await vehicleRepository.findById(id);
    if (!existing) throw new VehicleServiceError("Vehicle not found.", 404);

    const existingPlate = await vehicleRepository.findByPlateNumber(input.plateNumber, id);
    if (existingPlate) throw new VehicleServiceError("A vehicle with this plate number already exists.", 409);

    const updated = await vehicleRepository.update(id, {
      plateNumber: input.plateNumber,
      type: input.type,
      capacity: input.capacity || null,
      status: input.status,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "vehicles",
      entityType: "Vehicle",
      entityId: id,
      description: `Updated vehicle "${updated.plateNumber}"`,
      oldValues: { plateNumber: existing.plateNumber, status: existing.status },
      newValues: { plateNumber: updated.plateNumber, status: updated.status },
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...updated, _count: { deliveries: 0 } });
  },

  async remove(id: string, actor: ActorContext) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new VehicleServiceError("Vehicle not found.", 404);

    const pendingCount = await vehicleRepository.countActiveDeliveries(id);
    if (pendingCount > 0) {
      throw new VehicleServiceError(
        `Cannot delete "${vehicle.plateNumber}" — it is assigned to ${pendingCount} pending delivery/deliveries.`,
        409,
      );
    }

    await vehicleRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "vehicles",
      entityType: "Vehicle",
      entityId: id,
      description: `Deleted vehicle "${vehicle.plateNumber}"`,
      ipAddress: actor.ipAddress,
    });
  },

  getOptions() {
    return vehicleRepository.findActiveOptions();
  },
};
