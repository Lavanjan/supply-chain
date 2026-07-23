export const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  "invalid-credentials": "Invalid email or password.",
  "account-locked":
    "Your account has been locked due to multiple failed login attempts. Try again in 15 minutes.",
  "account-inactive": "Your account is inactive. Contact your administrator.",
  CredentialsSignin: "Invalid email or password.",
};

export function resolveLoginErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return LOGIN_ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}
