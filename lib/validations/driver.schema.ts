import { z } from "zod";

export const driverStatusValues = ["ACTIVE", "INACTIVE"] as const;

export const driverSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Too long"),
  licenseNumber: z.string().min(1, "License number is required").max(50, "Too long"),
  phone: z.string().min(1, "Phone is required").max(30, "Too long"),
  status: z.enum(driverStatusValues),
});

export type DriverInput = z.infer<typeof driverSchema>;
