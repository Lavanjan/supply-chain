"use server";

import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth.schema";
import { authService } from "@/services/auth.service";
import type { ActionResult } from "@/features/auth/actions/forgot-password.action";

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return { success: true, message: "Your password has been reset. You can now sign in." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to reset password.",
    };
  }
}
