import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}'`,
  ].join("; ");
}

function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const allowed = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (origin === req.nextUrl.origin) return origin;
  if (allowed.includes(origin)) return origin;

  return null;
}

function applyCorsHeaders(req: NextRequest, res: NextResponse) {
  const origin = getAllowedOrigin(req);
  if (!origin) return;

  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
}

function applyLogoutHeaders(pathname: string, res: NextResponse) {
  if (pathname !== "/api/auth/signout") return;
  res.headers.set("Clear-Site-Data", "\"cache\", \"cookies\", \"storage\"");
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!pathname.startsWith("/api")) {
    const nonce = crypto.randomUUID();
    const csp = buildCsp(nonce);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("content-security-policy", csp);
    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("x-nonce", nonce);
    applySecurityHeaders(res);
    return res;
  }

  const res = NextResponse.next();
  applySecurityHeaders(res);
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  if (pathname.startsWith("/api/auth")) {
    applyLogoutHeaders(pathname, res);
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
