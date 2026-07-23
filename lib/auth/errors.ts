import { CredentialsSignin } from "next-auth";

export class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid-credentials";
}

export class AccountLockedError extends CredentialsSignin {
  code = "account-locked";
}

export class AccountInactiveError extends CredentialsSignin {
  code = "account-inactive";
}
