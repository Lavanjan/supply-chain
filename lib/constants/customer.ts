import type { CustomerType } from "@/lib/generated/prisma/client";

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  HOSPITAL: "Hospital",
  PRISON: "Prison",
  SCHOOL: "School",
  HOTEL: "Hotel",
  GOVERNMENT: "Government",
  COMPANY: "Company",
  PRIVATE: "Private",
};

export const CUSTOMER_TYPE_COLORS: Record<CustomerType, string> = {
  HOSPITAL: "red",
  PRISON: "volcano",
  SCHOOL: "blue",
  HOTEL: "purple",
  GOVERNMENT: "gold",
  COMPANY: "cyan",
  PRIVATE: "default",
};
