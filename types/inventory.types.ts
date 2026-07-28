import type { InventoryMovementType } from "@/lib/generated/prisma/client";

export interface InventoryStockItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitSymbol: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  batchNumber: string | null;
  expiryDate: string | null;
  minimumStock: number;
  updatedAt: string;
}

export interface InventoryHistoryItem {
  id: string;
  productName: string;
  sku: string;
  warehouseName: string;
  type: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  batchNumber: string | null;
  expiryDate: string | null;
  notes: string | null;
  performedByName: string;
  createdAt: string;
}

export interface InventoryBatchOption {
  inventoryId: string;
  batchNumber: string | null;
  quantity: number;
  expiryDate: string | null;
}
