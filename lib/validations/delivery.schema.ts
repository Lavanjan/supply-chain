import { z } from "zod";

export const deliveryItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
});

export type DeliveryItemInput = z.infer<typeof deliveryItemSchema>;

export const deliverySchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  vehicleId: z.string().optional().or(z.literal("")),
  driverId: z.string().optional().or(z.literal("")),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  deliveryAddress: z.string().max(500, "Too long").optional().or(z.literal("")),
  notes: z.string().max(1000, "Too long").optional().or(z.literal("")),
  items: z.array(deliveryItemSchema).min(1, "Add at least one item"),
});

export type DeliveryInput = z.infer<typeof deliverySchema>;
