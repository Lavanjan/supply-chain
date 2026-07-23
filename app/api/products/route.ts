import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { productFilterSchema, productSchema } from "@/lib/validations/product.schema";
import { productService, ProductServiceError } from "@/services/product.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("products.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const searchParams = new URL(request.url).searchParams;
  const filters = productFilterSchema.parse({
    categoryId: searchParams.get("categoryId") ?? undefined,
    unitId: searchParams.get("unitId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  const result = await productService.list({ ...params, ...filters });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("products.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const product = await productService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof ProductServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
