import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { userRepository } from "@/repositories/user.repository";
import { passwordResetTokenRepository } from "@/repositories/password-reset-token.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import { emailService } from "@/services/email.service";
import { PASSWORD_RESET_TOKEN_TTL_MS } from "@/lib/constants/auth";
import type { UserInput } from "@/lib/validations/user.schema";
import type { PaginationParams } from "@/types/api.types";
import type { RoleOption, UserListItem } from "@/types/user.types";
import type { RoleName, Prisma } from "@/lib/generated/prisma/client";

export class UserServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface ActorContext {
  userId: string;
  userName: string;
  ipAddress: string | null;
}

type UserRow = Prisma.UserGetPayload<{ include: { role: { select: { id: true; name: true } } } }>;

function toListItem(user: UserRow): UserListItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId,
    roleName: user.role.name,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}

async function sendSetPasswordInvite(userId: string, email: string, name: string) {
  await passwordResetTokenRepository.invalidateAllForUser(userId);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
  await passwordResetTokenRepository.create(userId, token, expiresAt);

  const setPasswordUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  await emailService.sendWelcomeEmail(email, name, setPasswordUrl);
}

export const userService = {
  async list(params: PaginationParams & { roleId?: string; isActive?: boolean }) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = {
      search: params.search,
      roleId: params.roleId,
      isActive: params.isActive,
    };

    const [rows, total] = await Promise.all([
      userRepository.findMany({ ...filterArgs, skip, take: params.pageSize, sortField: params.sortField, sortOrder: params.sortOrder }),
      userRepository.count(filterArgs),
    ]);

    return { data: rows.map(toListItem), total, page: params.page, pageSize: params.pageSize };
  },

  async getRoleOptions(): Promise<RoleOption[]> {
    return userRepository.listRoleOptions();
  },

  async create(input: UserInput, actor: ActorContext): Promise<UserListItem> {
    const existing = await userRepository.findByEmailAny(input.email);
    if (existing) {
      throw new UserServiceError("A user with this email already exists.", 409);
    }

    const temporaryPassword = randomBytes(24).toString("hex");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const created = await userRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      roleId: input.roleId,
      isActive: input.isActive,
      passwordHash,
    });

    await sendSetPasswordInvite(created.id, created.email, created.name);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "users",
      entityType: "User",
      entityId: created.id,
      description: `Created user ${created.email} (${created.role.name})`,
      ipAddress: actor.ipAddress,
    });

    return toListItem(created);
  },

  async update(id: string, input: UserInput, actor: ActorContext): Promise<UserListItem> {
    const existing = await userRepository.findByIdWithRole(id);
    if (!existing) throw new UserServiceError("User not found.", 404);

    if (input.email.toLowerCase() !== existing.email) {
      const emailOwner = await userRepository.findByEmailAny(input.email);
      if (emailOwner && emailOwner.id !== id) {
        throw new UserServiceError("A user with this email already exists.", 409);
      }
    }

    const isSelf = id === actor.userId;
    if (isSelf && !input.isActive) {
      throw new UserServiceError("You cannot deactivate your own account.", 400);
    }

    const roles = await userRepository.listRoleOptions();
    const targetRole = roles.find((role) => role.id === input.roleId);
    if (!targetRole) throw new UserServiceError("Selected role not found.", 422);

    const losesAdmin = existing.role.name === "ADMIN" && (targetRole.name !== "ADMIN" || !input.isActive);
    if (losesAdmin) {
      const otherActiveAdmins = await userRepository.countActiveAdmins(id);
      if (otherActiveAdmins === 0) {
        throw new UserServiceError("At least one active Admin account must remain.", 409);
      }
    }

    const updated = await userRepository.update(id, {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      roleId: input.roleId,
      isActive: input.isActive,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "users",
      entityType: "User",
      entityId: id,
      description: `Updated user ${updated.email}`,
      ipAddress: actor.ipAddress,
    });

    return toListItem(updated);
  },

  async resendInvite(id: string, actor: ActorContext) {
    const existing = await userRepository.findByIdWithRole(id);
    if (!existing) throw new UserServiceError("User not found.", 404);

    await sendSetPasswordInvite(existing.id, existing.email, existing.name);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "users",
      entityType: "User",
      entityId: id,
      description: `Sent password reset invite to ${existing.email}`,
      ipAddress: actor.ipAddress,
    });
  },

  async remove(id: string, actor: ActorContext) {
    const existing = await userRepository.findByIdWithRole(id);
    if (!existing) throw new UserServiceError("User not found.", 404);

    if (id === actor.userId) {
      throw new UserServiceError("You cannot delete your own account.", 400);
    }

    if (existing.role.name === ("ADMIN" as RoleName) && existing.isActive) {
      const otherActiveAdmins = await userRepository.countActiveAdmins(id);
      if (otherActiveAdmins === 0) {
        throw new UserServiceError("At least one active Admin account must remain.", 409);
      }
    }

    await userRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "users",
      entityType: "User",
      entityId: id,
      description: `Deleted user ${existing.email}`,
      ipAddress: actor.ipAddress,
    });
  },
};
