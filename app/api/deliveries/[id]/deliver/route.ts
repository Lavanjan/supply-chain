import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { deliveryService, DeliveryServiceError } from "@/services/delivery.service";
import { InventoryServiceError } from "@/services/inventory.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await requireApiPermission("deliveries.update");
  if (isGuardFailure(guard)) return guard.response;

  const { id } = await params;

  try {
    const delivery = await deliveryService.markDelivered(id, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(delivery);
  } catch (error) {
    if (error instanceof DeliveryServiceError || error instanceof InventoryServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
