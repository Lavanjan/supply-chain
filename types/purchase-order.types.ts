import type { PurchaseOrderStatus } from "@/lib/generated/prisma/client";

export interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  supplierName: string;
  warehouseName: string;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  itemCount: number;
  createdAt: string;
}

export interface PurchaseOrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitSymbol: string;
  quantity: number;
}

export interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierAddress: string | null;
  supplierContactPerson: string;
  supplierPhone: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  notes: string | null;
  chequeNumber: string | null;
  chequeBankName: string | null;
  chequeDate: string | null;
  chequeAmount: number | null;
  createdByName: string;
  approvedByName: string | null;
  approvedAt: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  items: PurchaseOrderItemDetail[];
  createdAt: string;
  updatedAt: string;
}
