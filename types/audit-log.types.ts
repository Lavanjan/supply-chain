import type { AuditAction } from "@/lib/generated/prisma/client";

export interface AuditLogListItem {
  id: string;
  userName: string;
  action: AuditAction;
  module: string;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
