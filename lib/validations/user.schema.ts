import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Too long"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().max(30, "Too long").optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  isActive: z.boolean(),
});

export type UserInput = z.infer<typeof userSchema>;
