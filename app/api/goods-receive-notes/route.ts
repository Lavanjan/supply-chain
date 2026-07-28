import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { goodsReceiveNoteSchema } from "@/lib/validations/goods-receive-note.schema";
import { goodsReceiveNoteService, GoodsReceiveNoteServiceError } from "@/services/goods-receive-note.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("goods-receive-notes.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const warehouseId = new URL(request.url).searchParams.get("warehouseId") ?? undefined;

  const result = await goodsReceiveNoteService.list({ ...params, warehouseId });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("goods-receive-notes.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = goodsReceiveNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const grn = await goodsReceiveNoteService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(grn, { status: 201 });
  } catch (error) {
    if (error instanceof GoodsReceiveNoteServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
