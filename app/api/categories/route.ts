import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { categorySchema } from "@/lib/validations/category.schema";
import { categoryService, CategoryServiceError } from "@/services/category.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("categories.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const result = await categoryService.list(params);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("categories.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const category = await categoryService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
