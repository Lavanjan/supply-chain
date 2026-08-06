import bcrypt from "bcryptjs";
import { userRepository } from "@/repositories/user.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user.schema";
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
    username: user.username,
    phone: user.phone,
    roleId: user.roleId,
    roleName: user.role.name,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
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

  async create(input: CreateUserInput, actor: ActorContext): Promise<UserListItem> {
    const existingUsername = await userRepository.findByUsernameAny(input.username);
    if (existingUsername) {
      throw new UserServiceError("A user with this username already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const created = await userRepository.create({
      name: input.name,
      username: input.username,
      phone: input.phone || null,
      roleId: input.roleId,
      isActive: input.isActive,
      passwordHash,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "users",
      entityType: "User",
      entityId: created.id,
      description: `Created user ${created.username} (${created.role.name})`,
      ipAddress: actor.ipAddress,
    });

    return toListItem(created);
  },

  async update(id: string, input: UpdateUserInput, actor: ActorContext): Promise<UserListItem> {
    const existing = await userRepository.findByIdWithRole(id);
    if (!existing) throw new UserServiceError("User not found.", 404);

    if (input.username.toLowerCase() !== existing.username) {
      const usernameOwner = await userRepository.findByUsernameAny(input.username);
      if (usernameOwner && usernameOwner.id !== id) {
        throw new UserServiceError("A user with this username already exists.", 409);
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
      username: input.username,
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
      description: `Updated user ${updated.username}`,
      ipAddress: actor.ipAddress,
    });

    return toListItem(updated);
  },

  async resetPassword(id: string, newPassword: string, actor: ActorContext) {
    const existing = await userRepository.findByIdWithRole(id);
    if (!existing) throw new UserServiceError("User not found.", 404);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await userRepository.updatePassword(id, passwordHash);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "users",
      entityType: "User",
      entityId: id,
      description: `Reset password for ${existing.username}`,
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
      description: `Deleted user ${existing.username}`,
      ipAddress: actor.ipAddress,
    });
  },
};
