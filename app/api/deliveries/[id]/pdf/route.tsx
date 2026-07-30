import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { deliveryService, DeliveryServiceError } from "@/services/delivery.service";
import { settingsService } from "@/services/settings.service";
import { DeliveryNoteDocument } from "@/features/deliveries/pdf/delivery-note-document";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("deliveries.view");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    const [delivery, company] = await Promise.all([deliveryService.getById(id), settingsService.getGeneralSettings()]);
    const buffer = await renderToBuffer(<DeliveryNoteDocument delivery={delivery} company={company} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${delivery.deliveryNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof DeliveryServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
