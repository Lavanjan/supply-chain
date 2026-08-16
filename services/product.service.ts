import { randomBytes } from "crypto";
import { productRepository } from "@/repositories/product.repository";
import { categoryRepository } from "@/repositories/category.repository";
import { unitRepository } from "@/repositories/unit.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import { deleteFromR2, extractR2Key } from "@/lib/storage/r2";
import type { ProductInput } from "@/lib/validations/product.schema";
import type { PaginationParams } from "@/types/api.types";
import type { ProductStatus } from "@/lib/generated/prisma/client";

async function cleanupReplacedImage(previousUrl: string | null, nextUrl: string | null) {
  if (!previousUrl || previousUrl === nextUrl) return;
  const key = extractR2Key(previousUrl);
  if (!key) return;
  try {
    await deleteFromR2(key);
  } catch (error) {
    console.error("Failed to delete replaced product image from R2:", error);
  }
}

export class ProductServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface ActorContext {
  userId: string;
  userName: string;
  ipAddress: string | null;
}

interface ListParams extends PaginationParams {
  categoryId?: string;
  unitId?: string;
  status?: ProductStatus;
}

function generateQrCode(): string {
  return randomBytes(6).toString("hex").toUpperCase();
}

function toListItem(product: Awaited<ReturnType<typeof productRepository.findById>>) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    qrCode: product.qrCode,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    unitId: product.unitId,
    unitName: product.unit.name,
    unitSymbol: product.unit.symbol,
    minimumStock: Number(product.minimumStock),
    maximumStock: Number(product.maximumStock),
    currentStock: Number(product.currentStock),
    imageUrl: product.imageUrl,
    description: product.description,
    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export const productService = {
  async list(params: ListParams) {
    const skip = (params.page - 1) * params.pageSize;
    const filterArgs = {
      search: params.search,
      categoryId: params.categoryId,
      unitId: params.unitId,
      status: params.status,
    };

    const [products, total] = await Promise.all([
      productRepository.findMany({
        skip,
        take: params.pageSize,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
        ...filterArgs,
      }),
      productRepository.count(filterArgs),
    ]);

    return {
      data: products.map((product) => toListItem(product)),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  async getFormOptions() {
    const [categories, units] = await Promise.all([
      categoryRepository.findActiveOptions(),
      unitRepository.findActiveOptions(),
    ]);
    return { categories, units };
  },

  async create(input: ProductInput, actor: ActorContext) {
    const [existingSku, category, unit] = await Promise.all([
      productRepository.findBySku(input.sku),
      categoryRepository.findById(input.categoryId),
      unitRepository.findById(input.unitId),
    ]);

    if (existingSku) throw new ProductServiceError("A product with this SKU already exists.", 409);
    if (!category) throw new ProductServiceError("Selected category was not found.", 422);
    if (!unit) throw new ProductServiceError("Selected unit was not found.", 422);

    if (input.barcode) {
      const existingBarcode = await productRepository.findByBarcode(input.barcode);
      if (existingBarcode) throw new ProductServiceError("A product with this barcode already exists.", 409);
    }

    const product = await productRepository.create({
      name: input.name,
      sku: input.sku,
      barcode: input.barcode || null,
      qrCode: generateQrCode(),
      categoryId: input.categoryId,
      unitId: input.unitId,
      minimumStock: input.minimumStock,
      maximumStock: input.maximumStock,
      currentStock: input.currentStock,
      imageUrl: input.imageUrl || null,
      description: input.description || null,
      status: input.status,
      createdBy: actor.userId,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "products",
      entityType: "Product",
      entityId: product.id,
      description: `Created product "${product.name}" (${product.sku})`,
      ipAddress: actor.ipAddress,
    });

    return toListItem(product);
  },

  async update(id: string, input: ProductInput, actor: ActorContext) {
    const [existing, category, unit] = await Promise.all([
      productRepository.findById(id),
      categoryRepository.findById(input.categoryId),
      unitRepository.findById(input.unitId),
    ]);

    if (!existing) throw new ProductServiceError("Product not found.", 404);
    if (!category) throw new ProductServiceError("Selected category was not found.", 422);
    if (!unit) throw new ProductServiceError("Selected unit was not found.", 422);

    const existingSku = await productRepository.findBySku(input.sku, id);
    if (existingSku) throw new ProductServiceError("A product with this SKU already exists.", 409);

    if (input.barcode) {
      const existingBarcode = await productRepository.findByBarcode(input.barcode, id);
      if (existingBarcode) throw new ProductServiceError("A product with this barcode already exists.", 409);
    }

    const updated = await productRepository.update(id, {
      name: input.name,
      sku: input.sku,
      barcode: input.barcode || null,
      categoryId: input.categoryId,
      unitId: input.unitId,
      minimumStock: input.minimumStock,
      maximumStock: input.maximumStock,
      currentStock: input.currentStock,
      imageUrl: input.imageUrl || null,
      description: input.description || null,
      status: input.status,
      updatedBy: actor.userId,
    });

    await cleanupReplacedImage(existing.imageUrl, updated.imageUrl);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "products",
      entityType: "Product",
      entityId: id,
      description: `Updated product "${updated.name}" (${updated.sku})`,
      oldValues: {
        name: existing.name,
        sku: existing.sku,
        currentStock: Number(existing.currentStock),
        status: existing.status,
      },
      newValues: {
        name: updated.name,
        sku: updated.sku,
        currentStock: Number(updated.currentStock),
        status: updated.status,
      },
      ipAddress: actor.ipAddress,
    });

    return toListItem(updated);
  },

  async remove(id: string, actor: ActorContext) {
    const product = await productRepository.findById(id);
    if (!product) throw new ProductServiceError("Product not found.", 404);

    await productRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "products",
      entityType: "Product",
      entityId: id,
      description: `Deleted product "${product.name}" (${product.sku})`,
      ipAddress: actor.ipAddress,
    });
  },
};
