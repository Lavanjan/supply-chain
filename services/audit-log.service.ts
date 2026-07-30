import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { PaginationParams } from "@/types/api.types";
import type { AuditLogListItem } from "@/types/audit-log.types";

interface AuditLogFilters {
  module?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

function toListItem(row: Awaited<ReturnType<typeof auditLogRepository.findMany>>[number]): AuditLogListItem {
  return {
    id: row.id,
    userName: row.userName,
    action: row.action,
    module: row.module,
    entityType: row.entityType,
    entityId: row.entityId,
    description: row.description,
    oldValues: row.oldValues,
    newValues: row.newValues,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  };
}

export const auditLogService = {
  async list(params: PaginationParams & AuditLogFilters) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = {
      search: params.search,
      module: params.module,
      action: params.action,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    };

    const [rows, total] = await Promise.all([
      auditLogRepository.findMany({ ...filterArgs, skip, take: params.pageSize }),
      auditLogRepository.count(filterArgs),
    ]);

    return { data: rows.map(toListItem), total, page: params.page, pageSize: params.pageSize };
  },
};
