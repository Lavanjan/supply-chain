import { z } from "zod";

export const warehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required").max(200, "Name is too long"),
  code: z.string().min(1, "Code is required").max(50, "Code is too long"),
  address: z.string().max(500, "Address is too long").optional().or(z.literal("")),
  managerName: z.string().max(100, "Name is too long").optional().or(z.literal("")),
  phone: z.string().max(30, "Phone is too long").optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;
