import { ensureCsrfToken } from "@/lib/csrf-client";
import { CSRF_HEADER_NAME } from "@/lib/core/csrf";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const csrfToken = await ensureCsrfToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(endpoint, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(csrfToken && { [CSRF_HEADER_NAME]: csrfToken }),
      ...options.headers,
    },
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data.data as T;
}
