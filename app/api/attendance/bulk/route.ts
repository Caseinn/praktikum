import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { AttendanceStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { bulkAttendanceSchema } from "@/lib/validations/schemas";

const MAX_BODY_BYTES = 100_000;
const MAX_NIMS = 200;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const limitKey = getRateLimitKey(req, "attendance-bulk", session.user.email);
  const limit = await checkRateLimit(limitKey, { windowMs: 60_000, max: 15 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload terlalu besar." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const parse = bulkAttendanceSchema.safeParse(body);
  if (!parse.success) {
    const errors = parse.error.issues.map((e) => e.message);
    return NextResponse.json({ error: errors[0] || "Input tidak valid." }, { status: 400 });
  }

  const { sessionId, status, nims: rawNims } = parse.data;
  const uniqueNims = Array.from(new Set(rawNims.map((nim) => nim.trim()).filter(Boolean)));

  if (uniqueNims.length === 0) {
    return NextResponse.json({ error: "Daftar NIM wajib diisi." }, { status: 400 });
  }
  if (uniqueNims.length > MAX_NIMS) {
    return NextResponse.json({ error: "Jumlah NIM terlalu banyak." }, { status: 413 });
  }

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!attendanceSession) {
    return NextResponse.json({ error: "Sesi presensi tidak ditemukan." }, { status: 404 });
  }

  const users = await prisma.user.findMany({
    where: { nim: { in: uniqueNims } },
    select: { id: true, nim: true },
  });
  if (users.length === 0) {
    return NextResponse.json(
      { error: "Pengguna dengan NIM tersebut tidak ditemukan." },
      { status: 404 }
    );
  }

  const foundNims = new Set(users.map((user) => user.nim ?? ""));
  const missing = uniqueNims.filter((nim) => !foundNims.has(nim));

  const timestamp = new Date();
  const batchSize = 20;
  for (let i = 0; i < users.length; i += batchSize) {
    const chunk = users.slice(i, i + batchSize);
    await Promise.all(
      chunk.map((user) =>
        prisma.attendanceRecord.upsert({
          where: { userId_sessionId: { userId: user.id, sessionId } },
          update: { status: status as AttendanceStatus, attendedAt: timestamp },
          create: { userId: user.id, sessionId, status: status as AttendanceStatus, attendedAt: timestamp },
        })
      )
    );
  }

  const adminHash = session.user.email
    ? createHash("sha256").update(session.user.email).digest("hex")
    : null;

  console.info("[audit] attendance.bulk", {
    adminHash,
    sessionId,
    status,
    updated: users.length,
  });

  return NextResponse.json({ ok: true, updated: users.length, missing });
}
