import { z } from "zod";

export const productStatusValues = ["ACTIVE", "INACTIVE", "DISCONTINUED"] as const;

export const productSchema = z
  .object({
    name: z.string().min(1, "Product name is required").max(200, "Name is too long"),
    sku: z.string().min(1, "SKU is required").max(50, "SKU is too long"),
    barcode: z.string().max(50, "Barcode is too long").optional().or(z.literal("")),
    categoryId: z.string().min(1, "Category is required"),
    unitId: z.string().min(1, "Unit is required"),
    purchasePrice: z.number().min(0, "Must be 0 or greater"),
    sellingPrice: z.number().min(0, "Must be 0 or greater"),
    minimumStock: z.number().min(0, "Must be 0 or greater"),
    maximumStock: z.number().min(0, "Must be 0 or greater"),
    currentStock: z.number().min(0, "Must be 0 or greater"),
    imageUrl: z.string().optional().or(z.literal("")),
    description: z.string().max(1000, "Description is too long").optional().or(z.literal("")),
    status: z.enum(productStatusValues),
  })
  .refine((data) => data.maximumStock >= data.minimumStock, {
    message: "Maximum stock must be greater than or equal to minimum stock",
    path: ["maximumStock"],
  });

export type ProductInput = z.infer<typeof productSchema>;

export const productFilterSchema = z.object({
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  status: z.enum(productStatusValues).optional(),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;
