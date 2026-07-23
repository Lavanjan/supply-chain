import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/rbac/permissions";
import { dashboardService } from "@/services/dashboard.service";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session.user.permissions, "dashboard.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const charts = await dashboardService.getCharts();
  return NextResponse.json(charts);
}
