import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { reportService } from "@/services/report.service";

const STATUS_VALUES = ["PENDING", "DELIVERED", "CANCELLED"];

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("reports.view");
  if (isGuardFailure(guard)) return guard.response;

  const searchParams = new URL(request.url).searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const result = await reportService.getSalesReport(
    {
      customerId: searchParams.get("customerId") ?? undefined,
      status: STATUS_VALUES.includes(status ?? "") ? status! : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      search: searchParams.get("search") ?? undefined,
    },
    { page, pageSize },
  );

  return NextResponse.json(result);
}
