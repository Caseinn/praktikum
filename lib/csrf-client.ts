"use client";

import { CSRF_COOKIE_NAME } from "@/lib/core/csrf";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;

  try {
    const res = await fetch("/api/csrf", {
      method: "GET",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.token === "string" ? data.token : null;
  } catch {
    return null;
  }
}
