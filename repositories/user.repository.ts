import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface UserListFilters {
  search?: string;
  roleId?: string;
  isActive?: boolean;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
  skip: number;
  take: number;
}

export const userRepository = {
  findByUsernameWithRole(username: string) {
    return prisma.user.findFirst({
      where: { username: username.toLowerCase(), isDeleted: false },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
  },

  findByIdWithRole(id: string) {
    return prisma.user.findFirst({
      where: { id, isDeleted: false },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
  },

  recordLoginSuccess(id: string, ip: string | null) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });
  },

  recordLoginFailure(id: string, lockUntil: Date | null, attempts: number) {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: lockUntil,
      },
    });
  },

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    });
  },

  buildListWhere(filters: Pick<UserListFilters, "search" | "roleId" | "isActive">): Prisma.UserWhereInput {
    return {
      isDeleted: false,
      ...(filters.roleId && { roleId: filters.roleId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { username: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    };
  },

  findMany(filters: UserListFilters) {
    return prisma.user.findMany({
      where: this.buildListWhere(filters),
      include: { role: { select: { id: true, name: true } } },
      orderBy: filters.sortField ? { [filters.sortField]: filters.sortOrder === "descend" ? "desc" : "asc" } : { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take,
    });
  },

  count(filters: Pick<UserListFilters, "search" | "roleId" | "isActive">) {
    return prisma.user.count({ where: this.buildListWhere(filters) });
  },

  findByUsernameAny(username: string) {
    return prisma.user.findFirst({ where: { username: username.toLowerCase() } });
  },

  create(data: {
    name: string;
    username: string;
    phone: string | null;
    roleId: string;
    isActive: boolean;
    passwordHash: string;
  }) {
    return prisma.user.create({
      data: {
        name: data.name,
        username: data.username.toLowerCase(),
        phone: data.phone,
        roleId: data.roleId,
        isActive: data.isActive,
        password: data.passwordHash,
      },
      include: { role: { select: { id: true, name: true } } },
    });
  },

  update(
    id: string,
    data: { name: string; username: string; phone: string | null; roleId: string; isActive: boolean },
  ) {
    return prisma.user.update({
      where: { id },
      data: { ...data, username: data.username.toLowerCase() },
      include: { role: { select: { id: true, name: true } } },
    });
  },

  softDelete(id: string, deletedBy: string) {
    return prisma.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false, deletedAt: new Date(), deletedBy },
    });
  },

  countActiveAdmins(excludingUserId?: string) {
    return prisma.user.count({
      where: {
        isDeleted: false,
        isActive: true,
        role: { name: "ADMIN" },
        ...(excludingUserId && { id: { not: excludingUserId } }),
      },
    });
  },

  listRoleOptions() {
    return prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  },
};
