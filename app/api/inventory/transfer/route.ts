import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { transferSchema } from "@/lib/validations/inventory.schema";
import { inventoryService, InventoryServiceError } from "@/services/inventory.service";

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("inventory.transfer");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    await inventoryService.transfer(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof InventoryServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
