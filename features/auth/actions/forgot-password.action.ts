"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth.schema";
import { authService } from "@/services/auth.service";

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const t = await getTranslations("auth.forgotPassword");
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? t("invalidInput") };
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;

  await authService.requestPasswordReset(parsed.data.email, ip);

  return {
    success: true,
    message: t("successMessage"),
  };
}
