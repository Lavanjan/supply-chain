import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

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

export const auditLogRepository = {
  create(input: CreateAuditLogInput) {
    return prisma.auditLog.create({ data: input });
  },
};
