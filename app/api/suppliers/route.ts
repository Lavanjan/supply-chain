import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { supplierSchema } from "@/lib/validations/supplier.schema";
import { supplierService, SupplierServiceError } from "@/services/supplier.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("suppliers.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const result = await supplierService.list({
    ...params,
    status: status === "ACTIVE" || status === "INACTIVE" ? status : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("suppliers.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const supplier = await supplierService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    if (error instanceof SupplierServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
