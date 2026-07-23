import type { ProductStatus } from "@/lib/generated/prisma/client";

export interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  qrCode: string | null;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  unitSymbol: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock: number;
  currentStock: number;
  imageUrl: string | null;
  description: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
  id: string;
  name: string;
  symbol?: string;
}
