import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { auditLogService } from "@/services/audit-log.service";

const ACTION_VALUES = ["LOGIN", "LOGOUT", "LOGIN_FAILED", "CREATE", "UPDATE", "DELETE", "APPROVE", "CANCEL", "RESTORE"];

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("audit-logs.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const searchParams = new URL(request.url).searchParams;
  const action = searchParams.get("action");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const result = await auditLogService.list({
    ...params,
    module: searchParams.get("module") ?? undefined,
    action: ACTION_VALUES.includes(action ?? "") ? action! : undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  });
  return NextResponse.json(result);
}
