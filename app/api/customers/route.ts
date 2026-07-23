import { NextResponse, type NextRequest } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { parsePaginationParams } from "@/lib/api/pagination";
import { getClientIp } from "@/lib/utils/request";
import { customerSchema, customerStatusValues, customerTypeValues } from "@/lib/validations/customer.schema";
import { customerService, CustomerServiceError } from "@/services/customer.service";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission("customers.view");
  if (isGuardFailure(guard)) return guard.response;

  const params = parsePaginationParams(request.url);
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get("status");
  const customerType = searchParams.get("customerType");

  const result = await customerService.list({
    ...params,
    status: customerStatusValues.includes(status as never) ? (status as never) : undefined,
    customerType: customerTypeValues.includes(customerType as never) ? (customerType as never) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("customers.create");
  if (isGuardFailure(guard)) return guard.response;

  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const customer = await customerService.create(parsed.data, {
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      ipAddress: getClientIp(request),
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
