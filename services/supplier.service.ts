import { supplierRepository } from "@/repositories/supplier.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { SupplierInput } from "@/lib/validations/supplier.schema";
import type { PaginationParams } from "@/types/api.types";
import type { PartnerStatus } from "@/lib/generated/prisma/client";

export class SupplierServiceError extends Error {
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
}

function toListItem(supplier: {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  status: PartnerStatus;
  createdAt: Date;
  updatedAt: Date;
  _count: { purchaseOrders: number };
}) {
  return {
    id: supplier.id,
    companyName: supplier.companyName,
    contactPerson: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    bankName: supplier.bankName,
    bankAccountName: supplier.bankAccountName,
    bankAccountNumber: supplier.bankAccountNumber,
    bankBranch: supplier.bankBranch,
    status: supplier.status,
    purchaseOrderCount: supplier._count.purchaseOrders,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}

function toWriteData(input: SupplierInput) {
  return {
    companyName: input.companyName,
    contactPerson: input.contactPerson,
    phone: input.phone,
    email: input.email || null,
    address: input.address || null,
    bankName: input.bankName || null,
    bankAccountName: input.bankAccountName || null,
    bankAccountNumber: input.bankAccountNumber || null,
    bankBranch: input.bankBranch || null,
    status: input.status,
  };
}

export const supplierService = {
  async list(params: ListParams) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = { search: params.search, status: params.status };

    const [suppliers, total] = await Promise.all([
      supplierRepository.findMany({
        skip,
        take: params.pageSize,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
        ...filterArgs,
      }),
      supplierRepository.count(filterArgs),
    ]);

    return {
      data: suppliers.map((supplier) => toListItem(supplier)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  async create(input: SupplierInput, actor: ActorContext) {
    const supplier = await supplierRepository.create(toWriteData(input));

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "suppliers",
      entityType: "Supplier",
      entityId: supplier.id,
      description: `Created supplier "${supplier.companyName}"`,
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...supplier, _count: { purchaseOrders: 0 } });
  },

  async update(id: string, input: SupplierInput, actor: ActorContext) {
    const existing = await supplierRepository.findById(id);
    if (!existing) throw new SupplierServiceError("Supplier not found.", 404);

    const updated = await supplierRepository.update(id, toWriteData(input));
    const purchaseOrderCount = await supplierRepository.countPurchaseOrders(id);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "suppliers",
      entityType: "Supplier",
      entityId: id,
      description: `Updated supplier "${updated.companyName}"`,
      oldValues: { companyName: existing.companyName, status: existing.status, phone: existing.phone },
      newValues: { companyName: updated.companyName, status: updated.status, phone: updated.phone },
      ipAddress: actor.ipAddress,
    });

    return toListItem({ ...updated, _count: { purchaseOrders: purchaseOrderCount } });
  },

  async remove(id: string, actor: ActorContext) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) throw new SupplierServiceError("Supplier not found.", 404);

    const purchaseOrderCount = await supplierRepository.countPurchaseOrders(id);
    if (purchaseOrderCount > 0) {
      throw new SupplierServiceError(
        `Cannot delete "${supplier.companyName}" — it has ${purchaseOrderCount} purchase order(s).`,
        409,
      );
    }

    await supplierRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "suppliers",
      entityType: "Supplier",
      entityId: id,
      description: `Deleted supplier "${supplier.companyName}"`,
      ipAddress: actor.ipAddress,
    });
  },
};
