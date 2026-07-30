import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { reportService } from "@/services/report.service";

const TYPE_VALUES = ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT"];

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("reports.view");
  if (isGuardFailure(guard)) return guard.response;

  const searchParams = new URL(request.url).searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));
  const type = searchParams.get("type");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const result = await reportService.getStockMovementReport(
    {
      warehouseId: searchParams.get("warehouseId") ?? undefined,
      productId: searchParams.get("productId") ?? undefined,
      type: TYPE_VALUES.includes(type ?? "") ? type! : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      search: searchParams.get("search") ?? undefined,
    },
    { page, pageSize },
  );

  return NextResponse.json(result);
}
