import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { deliverySchema } from "@/lib/validations/delivery.schema";
import { deliveryService, DeliveryServiceError } from "@/services/delivery.service";

const STATUS_VALUES = ["PENDING", "DELIVERED", "CANCELLED"];

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("deliveries.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const status = new URL(request.url).searchParams.get("status");

  const result = await deliveryService.list({
    ...params,
    status: STATUS_VALUES.includes(status ?? "") ? (status as never) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("deliveries.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = deliverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const delivery = await deliveryService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    if (error instanceof DeliveryServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
