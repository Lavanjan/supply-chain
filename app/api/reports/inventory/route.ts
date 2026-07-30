import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { reportService } from "@/services/report.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("reports.view");
  if (isGuardFailure(guard)) return guard.response;

  const searchParams = new URL(request.url).searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const result = await reportService.getInventoryReport(
    {
      categoryId: searchParams.get("categoryId") ?? undefined,
      warehouseId: searchParams.get("warehouseId") ?? undefined,
      lowStockOnly: searchParams.get("lowStockOnly") === "true",
      search: searchParams.get("search") ?? undefined,
    },
    { page, pageSize },
  );

  return NextResponse.json(result);
}
