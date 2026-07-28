import { z } from "zod";

export const vehicleStatusValues = ["ACTIVE", "MAINTENANCE", "INACTIVE"] as const;

export const vehicleSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required").max(30, "Too long"),
  type: z.string().min(1, "Type is required").max(50, "Too long"),
  capacity: z.string().max(50, "Too long").optional().or(z.literal("")),
  status: z.enum(vehicleStatusValues),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
