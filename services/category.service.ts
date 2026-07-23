import { categoryRepository } from "@/repositories/category.repository";
import { auditLogRepository } from "@/repositories/audit-log.repository";
import type { CategoryInput } from "@/lib/validations/category.schema";
import type { PaginationParams } from "@/types/api.types";

export class CategoryServiceError extends Error {
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

export const categoryService = {
  async list(params: PaginationParams) {
    const skip = (params.page - 1) * params.pageSize;
    const [data, total] = await Promise.all([
      categoryRepository.findMany({
        skip,
        take: params.pageSize,
        search: params.search,
        sortField: params.sortField,
        sortOrder: params.sortOrder,
      }),
      categoryRepository.count(params.search),
    ]);

    return {
      data: data.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        productCount: category._count.products,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      })),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  },

  async create(input: CategoryInput, actor: ActorContext) {
    const existing = await categoryRepository.findByName(input.name);
    if (existing) throw new CategoryServiceError("A category with this name already exists.", 409);

    const category = await categoryRepository.create({
      name: input.name,
      description: input.description || undefined,
      isActive: input.isActive,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "CREATE",
      module: "categories",
      entityType: "Category",
      entityId: category.id,
      description: `Created category "${category.name}"`,
      ipAddress: actor.ipAddress,
    });

    return category;
  },

  async update(id: string, input: CategoryInput, actor: ActorContext) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new CategoryServiceError("Category not found.", 404);

    const existing = await categoryRepository.findByName(input.name, id);
    if (existing) throw new CategoryServiceError("A category with this name already exists.", 409);

    const updated = await categoryRepository.update(id, {
      name: input.name,
      description: input.description || undefined,
      isActive: input.isActive,
    });

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "UPDATE",
      module: "categories",
      entityType: "Category",
      entityId: id,
      description: `Updated category "${updated.name}"`,
      oldValues: { name: category.name, description: category.description, isActive: category.isActive },
      newValues: { name: updated.name, description: updated.description, isActive: updated.isActive },
      ipAddress: actor.ipAddress,
    });

    return updated;
  },

  async remove(id: string, actor: ActorContext) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new CategoryServiceError("Category not found.", 404);

    const productCount = await categoryRepository.countActiveProducts(id);
    if (productCount > 0) {
      throw new CategoryServiceError(
        `Cannot delete "${category.name}" — it is used by ${productCount} product(s).`,
        409,
      );
    }

    await categoryRepository.softDelete(id, actor.userId);

    await auditLogRepository.create({
      userId: actor.userId,
      userName: actor.userName,
      action: "DELETE",
      module: "categories",
      entityType: "Category",
      entityId: id,
      description: `Deleted category "${category.name}"`,
      ipAddress: actor.ipAddress,
    });
  },
};
