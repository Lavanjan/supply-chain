import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { goodsReceiveNoteService, GoodsReceiveNoteServiceError } from "@/services/goods-receive-note.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("goods-receive-notes.view");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;
  try {
    const grn = await goodsReceiveNoteService.getById(id);
    return NextResponse.json(grn);
  } catch (error) {
    if (error instanceof GoodsReceiveNoteServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
