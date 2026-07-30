import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface AuditLogListFilters {
  search?: string;
  module?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  skip: number;
  take: number;
}

export interface CreateAuditLogInput {
  userId?: string | null;
  userName: string;
  action: Prisma.AuditLogCreateInput["action"];
  module: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function buildListWhere(filters: Pick<AuditLogListFilters, "search" | "module" | "action" | "dateFrom" | "dateTo">): Prisma.AuditLogWhereInput {
  return {
    ...(filters.module && { module: filters.module }),
    ...(filters.action && { action: filters.action as never }),
    ...((filters.dateFrom || filters.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    }),
    ...(filters.search && {
      OR: [
        { userName: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };
}

export const auditLogRepository = {
  create(input: CreateAuditLogInput) {
    return prisma.auditLog.create({ data: input });
  },

  findMany(filters: AuditLogListFilters) {
    return prisma.auditLog.findMany({
      where: buildListWhere(filters),
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take,
    });
  },

  count(filters: Pick<AuditLogListFilters, "search" | "module" | "action" | "dateFrom" | "dateTo">) {
    return prisma.auditLog.count({ where: buildListWhere(filters) });
  },
};
