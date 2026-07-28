import { z } from "zod";

export const goodsReceiveItemSchema = z.object({
  purchaseItemId: z.string().min(1),
  productId: z.string().min(1),
  receivedQuantity: z.number().min(0, "Must be 0 or greater"),
  batchNumber: z.string().max(100, "Too long").optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
});

export type GoodsReceiveItemInput = z.infer<typeof goodsReceiveItemSchema>;

export const goodsReceiveNoteSchema = z
  .object({
    purchaseOrderId: z.string().min(1, "Purchase order is required"),
    receivedDate: z.string().min(1, "Received date is required"),
    notes: z.string().max(1000, "Too long").optional().or(z.literal("")),
    items: z.array(goodsReceiveItemSchema).min(1, "Add at least one item"),
  })
  .refine((data) => data.items.some((item) => item.receivedQuantity > 0), {
    message: "At least one item must have a received quantity greater than 0",
    path: ["items"],
  });

export type GoodsReceiveNoteInput = z.infer<typeof goodsReceiveNoteSchema>;
