"use server";

import { headers } from "next/headers";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth.schema";
import { authService } from "@/services/auth.service";

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;

  await authService.requestPasswordReset(parsed.data.email, ip);

  return {
    success: true,
    message: "If an account exists for that email, we've sent password reset instructions.",
  };
}
