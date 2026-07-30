import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { purchaseOrderService, PurchaseOrderServiceError } from "@/services/purchase-order.service";
import { settingsService } from "@/services/settings.service";
import { PurchaseOrderDocument } from "@/features/purchase-orders/pdf/purchase-order-document";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("purchase-orders.view");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    const [po, company] = await Promise.all([purchaseOrderService.getById(id), settingsService.getGeneralSettings()]);
    const buffer = await renderToBuffer(<PurchaseOrderDocument po={po} company={company} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${po.poNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof PurchaseOrderServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
