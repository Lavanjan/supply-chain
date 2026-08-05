const KNOWN_LOGIN_ERROR_CODES = ["invalid-credentials", "account-locked", "account-inactive", "CredentialsSignin"];

export function resolveLoginErrorMessage(
  code: string | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!code) return null;
  const key = KNOWN_LOGIN_ERROR_CODES.includes(code) ? code : "default";
  return t(`errors.${key}`);
}
