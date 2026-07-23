import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { userRepository } from "@/repositories/user.repository";
import { passwordResetTokenRepository } from "@/repositories/password-reset-token.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import { emailService } from "@/services/email.service";
import {
  AccountInactiveError,
  AccountLockedError,
  InvalidCredentialsError,
} from "@/lib/auth/errors";
import {
  ACCOUNT_LOCK_DURATION_MS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from "@/lib/constants/auth";
import type { AuthorizedUser } from "@/types/rbac.types";

type UserWithRole = NonNullable<Awaited<ReturnType<typeof userRepository.findByEmailWithRole>>>;

function toAuthorizedUser(user: UserWithRole): AuthorizedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role.name,
    permissions: user.role.permissions.map((rolePermission) => rolePermission.permission.code),
  };
}

export const authService = {
  async validateCredentials(
    email: string,
    password: string,
    ip: string | null,
  ): Promise<AuthorizedUser> {
    const user = await userRepository.findByEmailWithRole(email);

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

  async requestPasswordReset(email: string, ip: string | null) {
    const user = await userRepository.findByEmailWithRole(email);

    if (!user) return;

    await passwordResetTokenRepository.invalidateAllForUser(user.id);

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
    await passwordResetTokenRepository.create(user.id, token, expiresAt);

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl);

    await auditLogRepository.create({
      userId: user.id,
      userName: user.name,
      action: "UPDATE",
      module: "auth",
      description: "Password reset requested",
      ipAddress: ip,
    });
  },

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await passwordResetTokenRepository.findValidByToken(token);

    if (!resetToken) {
      throw new Error("This password reset link is invalid or has expired.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await userRepository.updatePassword(resetToken.userId, passwordHash);
    await passwordResetTokenRepository.markUsed(resetToken.id);

    await auditLogRepository.create({
      userId: resetToken.userId,
      userName: resetToken.user.name,
      action: "UPDATE",
      module: "auth",
      description: "Password reset completed",
    });
  },
};
