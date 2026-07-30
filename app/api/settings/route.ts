import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { getClientIp } from "@/lib/utils/request";
import { settingsSchema } from "@/lib/validations/settings.schema";
import { settingsService } from "@/services/settings.service";

export async function GET() {
  const guard = await requireApiPermission("settings.view");
  if (isGuardFailure(guard)) return guard.response;

  const settings = await settingsService.getGeneralSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const guard = await requireApiPermission("settings.update");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const settings = await settingsService.updateGeneralSettings(parsed.data, {
    userId: guard.session.user.id,
    userName: guard.session.user.name ?? "",
    ipAddress: getClientIp(request),
  });
  return NextResponse.json(settings);
}
