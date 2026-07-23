import { z } from "zod";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortField: z.string().optional(),
  sortOrder: z.enum(["ascend", "descend"]).optional(),
});

export function parsePaginationParams(url: string) {
  const searchParams = new URL(url).searchParams;
  return paginationQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sortField: searchParams.get("sortField") ?? undefined,
    sortOrder: searchParams.get("sortOrder") ?? undefined,
  });
}
