import type { ApiErrorBody } from "@/types/api.types";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[] | undefined>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error);
    this.status = status;
    this.fieldErrors = body.fieldErrors;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ error: response.statusText }))) as ApiErrorBody;
    throw new ApiError(response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = {
  get<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const query = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== "")
            .map(([key, value]) => [key, String(value)]),
        ).toString()
      : "";
    return fetch(`${url}${query}`).then((response) => handleResponse<T>(response));
  },

  post<T>(url: string, body: unknown): Promise<T> {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((response) => handleResponse<T>(response));
  },

  patch<T>(url: string, body: unknown): Promise<T> {
    return fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((response) => handleResponse<T>(response));
  },

  delete<T>(url: string): Promise<T> {
    return fetch(url, { method: "DELETE" }).then((response) => handleResponse<T>(response));
  },
};
