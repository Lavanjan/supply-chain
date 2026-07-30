import { settingsRepository } from "@/repositories/settings.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { SettingsInput } from "@/lib/validations/settings.schema";
import type { CompanyProfile } from "@/types/settings.types";

const GENERAL_GROUP = "general";

const DEFAULTS: CompanyProfile = {
  companyName: "Supply Chain & Inventory Management System",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
};

const KEYS: Record<keyof CompanyProfile, string> = {
  companyName: "general.companyName",
  companyAddress: "general.companyAddress",
  companyPhone: "general.companyPhone",
  companyEmail: "general.companyEmail",
};

interface ActorContext {
  userId: string;
  userName: string;
  ipAddress: string | null;
}

export const settingsService = {
  async getGeneralSettings(): Promise<CompanyProfile> {
    const rows = await settingsRepository.findByGroup(GENERAL_GROUP);
    const map = new Map(rows.map((row) => [row.key, row.value]));

    return {
      companyName: (map.get(KEYS.companyName) as string) ?? DEFAULTS.companyName,
      companyAddress: (map.get(KEYS.companyAddress) as string) ?? DEFAULTS.companyAddress,
      companyPhone: (map.get(KEYS.companyPhone) as string) ?? DEFAULTS.companyPhone,
      companyEmail: (map.get(KEYS.companyEmail) as string) ?? DEFAULTS.companyEmail,
    };
  },

  async updateGeneralSettings(input: SettingsInput, actor: ActorContext): Promise<CompanyProfile> {
    await Promise.all([
      settingsRepository.upsert(KEYS.companyName, input.companyName, GENERAL_GROUP, actor.userId),
      settingsRepository.upsert(KEYS.companyAddress, input.companyAddress || "", GENERAL_GROUP, actor.userId),
      settingsRepository.upsert(KEYS.companyPhone, input.companyPhone || "", GENERAL_GROUP, actor.userId),
      settingsRepository.upsert(KEYS.companyEmail, input.companyEmail || "", GENERAL_GROUP, actor.userId),
    ]);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "settings",
      description: "Updated company profile settings",
      ipAddress: actor.ipAddress,
    });

    return this.getGeneralSettings();
  },
};
