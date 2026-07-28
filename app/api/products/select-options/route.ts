import { NextResponse } from "next/server";
import { isGuardFailure, requireApiPermission } from "@/lib/api/guard";
import { productRepository } from "@/repositories/product.repository";

export async function GET() {
  const guard = await requireApiPermission("products.view");
  if (isGuardFailure(guard)) return guard.response;

  const products = await productRepository.findActiveOptionsForSelect();
  return NextResponse.json(products);
}
