import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { categorySchema } from "@/lib/validations/category.schema";
import { categoryService, CategoryServiceError } from "@/services/category.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("categories.update");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const category = await categoryService.update(id, parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("categories.delete");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    await categoryService.remove(id, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof CategoryServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
