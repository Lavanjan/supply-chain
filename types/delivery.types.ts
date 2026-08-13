import type { DeliveryStatus } from "@/lib/generated/prisma/client";

export interface DeliveryListItem {
  id: string;
  deliveryNumber: string;
  customerName: string;
  warehouseName: string;
  vehiclePlateNumber: string | null;
  driverName: string | null;
  scheduledDate: string;
  deliveredDate: string | null;
  status: DeliveryStatus;
  itemCount: number;
  totalAmount: number;
}

export interface DeliveryItemDetail {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitSymbol: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DeliveryDetail {
  id: string;
  deliveryNumber: string;
  customerId: string;
  customerName: string;
  customerType: string;
  warehouseId: string;
  warehouseName: string;
  vehicleId: string | null;
  vehiclePlateNumber: string | null;
  driverId: string | null;
  driverName: string | null;
  scheduledDate: string;
  deliveredDate: string | null;
  status: DeliveryStatus;
  deliveryAddress: string | null;
  notes: string | null;
  totalAmount: number;
  createdByName: string;
  items: DeliveryItemDetail[];
  createdAt: string;
}
