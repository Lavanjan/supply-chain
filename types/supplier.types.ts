import type { PartnerStatus } from "@/lib/generated/prisma/client";

export interface SupplierListItem {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  status: PartnerStatus;
  purchaseOrderCount: number;
  createdAt: string;
  updatedAt: string;
}
