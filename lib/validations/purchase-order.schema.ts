import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
});

export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000, "Too long").optional().or(z.literal("")),
  items: z.array(purchaseOrderItemSchema).min(1, "Add at least one item"),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
