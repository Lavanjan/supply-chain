import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { notificationService } from "@/services/notification.service";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await notificationService.getInboxSummary(session.user.id);
  return NextResponse.json(summary);
}

export async function PATCH() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await notificationService.markAllRead(session.user.id);
  return NextResponse.json({ success: true });
}
