import { driverRepository } from "@/repositories/driver.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { DriverInput } from "@/lib/validations/driver.schema";
import type { PaginationParams } from "@/types/api.types";
import type { DriverStatus } from "@/lib/generated/prisma/client";

export class DriverServiceError extends Error {
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

function toListItem(driver: {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  status: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
  _count: { deliveries: number };
}) {
  return {
    id: driver.id,
    name: driver.name,
    licenseNumber: driver.licenseNumber,
    phone: driver.phone,
    status: driver.status,
    deliveryCount: driver._count.deliveries,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
  };
}

export const driverService = {
  async list(params: PaginationParams & { status?: DriverStatus }) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = { search: params.search, status: params.status };

    const [drivers, total] = await Promise.all([
      driverRepository.findMany({
        skip,
        take: params.pageSize,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
        ...filterArgs,
      }),
      driverRepository.count(filterArgs),
    ]);

    return { data: drivers.map(toListItem), total, page: params.page, pageSize: params.pageSize };
  },

  async create(input: DriverInput, actor: ActorContext) {
    const existing = await driverRepository.findByLicenseNumber(input.licenseNumber);
    if (existing) throw new DriverServiceError("A driver with this license number already exists.", 409);

    const driver = await driverRepository.create(input);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "drivers",
      entityType: "Driver",
      entityId: driver.id,
      description: `Created driver "${driver.name}"`,
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...driver, _count: { deliveries: 0 } });
  },

  async update(id: string, input: DriverInput, actor: ActorContext) {
    const existing = await driverRepository.findById(id);
    if (!existing) throw new DriverServiceError("Driver not found.", 404);

    const existingLicense = await driverRepository.findByLicenseNumber(input.licenseNumber, id);
    if (existingLicense) throw new DriverServiceError("A driver with this license number already exists.", 409);

    const updated = await driverRepository.update(id, input);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "drivers",
      entityType: "Driver",
      entityId: id,
      description: `Updated driver "${updated.name}"`,
      oldValues: { name: existing.name, status: existing.status },
      newValues: { name: updated.name, status: updated.status },
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...updated, _count: { deliveries: 0 } });
  },

  async remove(id: string, actor: ActorContext) {
    const driver = await driverRepository.findById(id);
    if (!driver) throw new DriverServiceError("Driver not found.", 404);

    const pendingCount = await driverRepository.countActiveDeliveries(id);
    if (pendingCount > 0) {
      throw new DriverServiceError(
        `Cannot delete "${driver.name}" — assigned to ${pendingCount} pending delivery/deliveries.`,
        409,
      );
    }

    await driverRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "drivers",
      entityType: "Driver",
      entityId: id,
      description: `Deleted driver "${driver.name}"`,
      ipAddress: actor.ipAddress,
    });
  },

  getOptions() {
    return driverRepository.findActiveOptions();
  },
};
