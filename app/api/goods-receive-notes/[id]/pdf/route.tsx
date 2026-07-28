import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { goodsReceiveNoteService, GoodsReceiveNoteServiceError } from "@/services/goods-receive-note.service";
import { GoodsReceiveNoteDocument } from "@/features/goods-receive-notes/pdf/grn-document";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("goods-receive-notes.view");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    const grn = await goodsReceiveNoteService.getById(id);
    const buffer = await renderToBuffer(<GoodsReceiveNoteDocument grn={grn} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${grn.grnNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof GoodsReceiveNoteServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
