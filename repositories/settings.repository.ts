import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export const settingsRepository = {
  findByGroup(group: string) {
    return prisma.setting.findMany({ where: { group } });
  },

  upsert(key: string, value: string, group: string, updatedBy: string) {
    return prisma.setting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue, updatedBy },
      create: { key, value: value as Prisma.InputJsonValue, group, updatedBy },
    });
  },
};
