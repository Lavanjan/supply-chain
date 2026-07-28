import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const guard = await requireApiPermission("customers.view");
  if (isGuardFailure(guard)) return guard.response;

  const customers = await prisma.customer.findMany({
    where: { isDeleted: false, status: "ACTIVE" },
    select: { id: true, companyName: true, address: true },
    orderBy: { companyName: "asc" },
  });
  return NextResponse.json(customers);
}
