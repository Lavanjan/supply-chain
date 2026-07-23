import { z } from "zod";

export const unitSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  symbol: z.string().min(1, "Symbol is required").max(20, "Symbol is too long"),
  isActive: z.boolean(),
});

export type UnitInput = z.infer<typeof unitSchema>;
