import type { CustomerType, PartnerStatus } from "@/lib/generated/prisma/client";

export interface CustomerListItem {
  id: string;
  companyName: string;
  customerType: CustomerType;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  status: PartnerStatus;
  deliveryCount: number;
  createdAt: string;
  updatedAt: string;
}
