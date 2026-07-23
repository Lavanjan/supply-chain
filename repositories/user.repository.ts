import { prisma } from "@/lib/db/prisma";

export const userRepository = {
  findByEmailWithRole(email: string) {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), isDeleted: false },
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
};
