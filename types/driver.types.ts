import type { DriverStatus } from "@/lib/generated/prisma/client";

export interface DriverListItem {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  status: DriverStatus;
  deliveryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverOption {
  id: string;
  name: string;
  licenseNumber: string;
}
