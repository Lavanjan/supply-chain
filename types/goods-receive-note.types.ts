import type { GrnStatus } from "@/lib/generated/prisma/client";

export interface GoodsReceiveNoteListItem {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  warehouseName: string;
  receivedDate: string;
  status: GrnStatus;
  itemCount: number;
  receivedById: string;
  receivedByName: string;
}

export interface GoodsReceiveItemDetail {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitSymbol: string;
  orderedQuantity: number;
  receivedQuantity: number;
  wastedQuantity: number;
  batchNumber: string | null;
  expiryDate: string | null;
}

export interface GoodsReceiveNoteDetail {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  receivedDate: string;
  status: GrnStatus;
  notes: string | null;
  receivedByName: string;
  items: GoodsReceiveItemDetail[];
  createdAt: string;
}

export interface ReceivableLineItem {
  purchaseItemId: string;
  productId: string;
  productName: string;
  sku: string;
  unitSymbol: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  previouslyWastedQuantity: number;
  remainingQuantity: number;
}

export interface ReceivablePurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  items: ReceivableLineItem[];
}

export interface PurchaseOrderReceivableOption {
  id: string;
  poNumber: string;
  supplierName: string;
}
