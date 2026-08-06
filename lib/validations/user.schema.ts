import { z } from "zod";
import { passwordRuleSchema } from "@/lib/validations/auth.schema";

const userBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Too long"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Too long")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores and hyphens"),
  phone: z.string().max(30, "Too long").optional().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  isActive: z.boolean(),
});

export const createUserSchema = userBaseSchema.extend({
  password: passwordRuleSchema,
});

export const updateUserSchema = userBaseSchema;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetUserPasswordSchema = z
  .object({
    password: passwordRuleSchema,
    confirmPassword: z.string().min(1, "Confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
