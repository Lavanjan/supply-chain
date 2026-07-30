import type { Metadata } from "next";
import { requirePermission } from "@/lib/rbac/permissions";
import { settingsService } from "@/services/settings.service";
import { SettingsForm } from "@/features/settings/components/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePermission("settings.view");

  const settings = await settingsService.getGeneralSettings();

  return <SettingsForm initialSettings={settings} />;
}
