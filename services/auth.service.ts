import bcrypt from "bcryptjs";
import { userRepository } from "@/repositories/user.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import {
  AccountInactiveError,
  AccountLockedError,
  InvalidCredentialsError,
} from "@/lib/auth/errors";
import { ACCOUNT_LOCK_DURATION_MS, MAX_FAILED_LOGIN_ATTEMPTS } from "@/lib/constants/auth";
import type { AuthorizedUser } from "@/types/rbac.types";

type UserWithRole = NonNullable<Awaited<ReturnType<typeof userRepository.findByUsernameWithRole>>>;

function toAuthorizedUser(user: UserWithRole): AuthorizedUser {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role.name,
    permissions: user.role.permissions.map((rolePermission) => rolePermission.permission.code),
  };
}

export const authService = {
  async validateCredentials(
    username: string,
    password: string,
    ip: string | null,
  ): Promise<AuthorizedUser> {
    const user = await userRepository.findByUsernameWithRole(username);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError();
    }

    if (!user.isActive) {
      throw new AccountInactiveError();
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;

      await userRepository.recordLoginFailure(
        user.id,
        shouldLock ? new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS) : null,
        shouldLock ? 0 : attempts,
      );

      await auditLogRepository.create({
        userId: user.id,
        userName: user.name,
        action: "LOGIN_FAILED",
        module: "auth",
        description: shouldLock
          ? "Account locked after repeated failed login attempts"
          : "Invalid password",
        ipAddress: ip,
      });

      throw shouldLock ? new AccountLockedError() : new InvalidCredentialsError();
    }

    await userRepository.recordLoginSuccess(user.id, ip);
    await auditLogRepository.create({
      userId: user.id,
      userName: user.name,
      action: "LOGIN",
      module: "auth",
      ipAddress: ip,
    });

    return toAuthorizedUser(user);
  },
};
