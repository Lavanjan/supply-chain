import { z } from "zod";

export const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(150, "Too long"),
  companyAddress: z.string().max(300, "Too long").optional().or(z.literal("")),
  companyPhone: z.string().max(30, "Too long").optional().or(z.literal("")),
  companyEmail: z.string().email("Enter a valid email address").optional().or(z.literal("")),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
