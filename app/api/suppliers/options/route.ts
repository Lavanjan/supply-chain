import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const guard = await requireApiPermission("suppliers.view");
  if (isGuardFailure(guard)) return guard.response;

  const suppliers = await prisma.supplier.findMany({
    where: { isDeleted: false, status: "ACTIVE" },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });
  return NextResponse.json(suppliers);
}
