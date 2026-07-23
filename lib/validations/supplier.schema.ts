import { z } from "zod";

export const supplierStatusValues = ["ACTIVE", "INACTIVE"] as const;

export const supplierSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200, "Name is too long"),
  contactPerson: z.string().min(1, "Contact person is required").max(100, "Name is too long"),
  phone: z.string().min(1, "Phone is required").max(30, "Phone is too long"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().max(500, "Address is too long").optional().or(z.literal("")),
  bankName: z.string().max(100, "Too long").optional().or(z.literal("")),
  bankAccountName: z.string().max(100, "Too long").optional().or(z.literal("")),
  bankAccountNumber: z.string().max(50, "Too long").optional().or(z.literal("")),
  bankBranch: z.string().max(100, "Too long").optional().or(z.literal("")),
  status: z.enum(supplierStatusValues),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
