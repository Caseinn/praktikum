import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { CSRF_COOKIE_NAME, CSRF_TTL_SECONDS } from "@/lib/core/csrf";

export async function GET() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const token = existing ?? randomUUID();

  const res = NextResponse.json({ token });
  res.headers.set("Cache-Control", "no-store");
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CSRF_TTL_SECONDS,
  });

  return res;
}
