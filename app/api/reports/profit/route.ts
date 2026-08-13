import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { reportService } from "@/services/report.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("reports.view");
  if (isGuardFailure(guard)) return guard.response;

  const searchParams = new URL(request.url).searchParams;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const result = await reportService.getProfitReport({
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  });

  return NextResponse.json(result);
}
