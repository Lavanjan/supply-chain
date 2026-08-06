import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants/auth";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordRuleSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");
