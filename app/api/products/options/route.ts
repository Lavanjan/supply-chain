import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { productService } from "@/services/product.service";

export async function GET() {
  const guard = await requireApiPermission("products.view");
  if (isGuardFailure(guard)) return guard.response;

  const options = await productService.getFormOptions();
  return NextResponse.json(options);
}
