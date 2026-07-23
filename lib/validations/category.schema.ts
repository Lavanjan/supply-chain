import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
