import type { VehicleStatus } from "@/lib/generated/prisma/client";

export interface VehicleListItem {
  id: string;
  plateNumber: string;
  type: string;
  capacity: string | null;
  status: VehicleStatus;
  deliveryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleOption {
  id: string;
  plateNumber: string;
  type: string;
}
