import type { PurchaseOrderStatus } from "@/lib/generated/prisma/client";

export interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  supplierName: string;
  warehouseName: string;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
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
  unitPrice: number;
  discount: number;
  tax: number;
  totalPrice: number;
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
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  createdByName: string;
  approvedByName: string | null;
  approvedAt: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  items: PurchaseOrderItemDetail[];
  createdAt: string;
  updatedAt: string;
}
