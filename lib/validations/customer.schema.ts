import { z } from "zod";

export const customerTypeValues = [
  "HOSPITAL",
  "PRISON",
  "SCHOOL",
  "HOTEL",
  "GOVERNMENT",
  "COMPANY",
  "PRIVATE",
] as const;

export const customerStatusValues = ["ACTIVE", "INACTIVE"] as const;

export const customerSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200, "Name is too long"),
  customerType: z.enum(customerTypeValues),
  contactPerson: z.string().max(100, "Name is too long").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required").max(30, "Phone is too long"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().max(500, "Address is too long").optional().or(z.literal("")),
  status: z.enum(customerStatusValues),
});

export type CustomerInput = z.infer<typeof customerSchema>;
