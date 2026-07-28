import { z } from "zod";

export const stockInSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  batchNumber: z.string().max(100, "Too long").optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(500, "Too long").optional().or(z.literal("")),
});

export type StockInInput = z.infer<typeof stockInSchema>;

export const stockOutSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  inventoryId: z.string().min(1, "Select the batch/row to remove stock from"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  notes: z.string().max(500, "Too long").optional().or(z.literal("")),
});

export type StockOutInput = z.infer<typeof stockOutSchema>;

export const adjustmentSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  inventoryId: z.string().min(1, "Select the batch/row to adjust"),
  newQuantity: z.number().min(0, "Must be 0 or greater"),
  notes: z.string().min(1, "A reason is required for adjustments").max(500, "Too long"),
});

export type AdjustmentInput = z.infer<typeof adjustmentSchema>;

export const transferSchema = z
  .object({
    productId: z.string().min(1, "Product is required"),
    fromWarehouseId: z.string().min(1, "Source warehouse is required"),
    toWarehouseId: z.string().min(1, "Destination warehouse is required"),
    inventoryId: z.string().min(1, "Select the batch/row to transfer"),
    quantity: z.number().positive("Quantity must be greater than 0"),
    notes: z.string().max(500, "Too long").optional().or(z.literal("")),
  })
  .refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
    message: "Source and destination warehouses must be different",
    path: ["toWarehouseId"],
  });

export type TransferInput = z.infer<typeof transferSchema>;
