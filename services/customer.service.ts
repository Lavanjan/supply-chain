import { customerRepository } from "@/repositories/customer.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { CustomerInput } from "@/lib/validations/customer.schema";
import type { PaginationParams } from "@/types/api.types";
import type { CustomerType, PartnerStatus } from "@/lib/generated/prisma/client";

export class CustomerServiceError extends Error {
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

interface ListParams extends PaginationParams {
  status?: PartnerStatus;
  customerType?: CustomerType;
}

function toListItem(customer: {
  id: string;
  companyName: string;
  customerType: CustomerType;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  status: PartnerStatus;
  createdAt: Date;
  updatedAt: Date;
  _count: { deliveries: number };
}) {
  return {
    id: customer.id,
    companyName: customer.companyName,
    customerType: customer.customerType,
    contactPerson: customer.contactPerson,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    status: customer.status,
    deliveryCount: customer._count.deliveries,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

function toWriteData(input: CustomerInput) {
  return {
    companyName: input.companyName,
    customerType: input.customerType,
    contactPerson: input.contactPerson || null,
    phone: input.phone,
    email: input.email || null,
    address: input.address || null,
    status: input.status,
  };
}

export const customerService = {
  async list(params: ListParams) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = { search: params.search, status: params.status, customerType: params.customerType };

    const [customers, total] = await Promise.all([
      customerRepository.findMany({
        skip,
        take: params.pageSize,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
        ...filterArgs,
      }),
      customerRepository.count(filterArgs),
    ]);

    return {
      data: customers.map((customer) => toListItem(customer)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  async create(input: CustomerInput, actor: ActorContext) {
    const customer = await customerRepository.create(toWriteData(input));

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "customers",
      entityType: "Customer",
      entityId: customer.id,
      description: `Created customer "${customer.companyName}"`,
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...customer, _count: { deliveries: 0 } });
  },

  async update(id: string, input: CustomerInput, actor: ActorContext) {
    const existing = await customerRepository.findById(id);
    if (!existing) throw new CustomerServiceError("Customer not found.", 404);

    const updated = await customerRepository.update(id, toWriteData(input));
    const deliveryCount = await customerRepository.countDeliveries(id);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "customers",
      entityType: "Customer",
      entityId: id,
      description: `Updated customer "${updated.companyName}"`,
      oldValues: { companyName: existing.companyName, status: existing.status, customerType: existing.customerType },
      newValues: { companyName: updated.companyName, status: updated.status, customerType: updated.customerType },
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...updated, _count: { deliveries: deliveryCount } });
  },

  async remove(id: string, actor: ActorContext) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new CustomerServiceError("Customer not found.", 404);

    const deliveryCount = await customerRepository.countDeliveries(id);
    if (deliveryCount > 0) {
      throw new CustomerServiceError(
        `Cannot delete "${customer.companyName}" — it has ${deliveryCount} delivery/deliveries on record.`,
        409,
      );
    }

    await customerRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "customers",
      entityType: "Customer",
      entityId: id,
      description: `Deleted customer "${customer.companyName}"`,
      ipAddress: actor.ipAddress,
    });
  },
};
