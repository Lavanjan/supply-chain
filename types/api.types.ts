export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

export interface ApiErrorBody {
  error: string;
  fieldErrors?: Record<string, string[] | undefined>;
}
