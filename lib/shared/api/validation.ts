import { z } from "zod";
import { badRequest } from "./response";
import type { NextResponse } from "next/server";

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstError = result.error.errors[0];
  const message = firstError
    ? `${firstError.path.join(".")}: ${firstError.message}`
    : "Validasi gagal.";

  return { success: false, response: badRequest(message) };
}

export function parseJsonBody(req: Request): Promise<unknown> {
  return req.json().catch(() => null);
}

export function getQueryParam(req: Request, key: string): string | null {
  const url = new URL(req.url);
  return url.searchParams.get(key);
}
