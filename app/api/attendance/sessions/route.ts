import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWIBDateTime } from "@/lib/time";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { sessionCreateSchema } from "@/lib/validations/schemas";

const MAX_BODY_BYTES = 20_000;

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });

  const items = await prisma.attendanceSession.findMany({
    orderBy: { createdAt: "desc" },
  });
  if (session.user?.role !== "ADMIN") {
    const limited = items.map((item) => ({
      id: item.id,
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime,
      radius: item.radius,
    }));
    return NextResponse.json(limited);
  }

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const limitKey = getRateLimitKey(req, "attendance-sessions-create", session.user.email);
  const limit = await checkRateLimit(limitKey, { windowMs: 60_000, max: 10 });
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

  const parse = sessionCreateSchema.safeParse(body);
  if (!parse.success) {
    const errors = parse.error.issues.map((e) => e.message);
    return NextResponse.json({ error: errors[0] || "Input tidak valid." }, { status: 400 });
  }

  const { title, startTime, latitude, longitude, radius } = parse.data;
  const startTimeUTC = parseWIBDateTime(startTime);
  if (!startTimeUTC) {
    return NextResponse.json({ error: "Waktu mulai tidak valid." }, { status: 400 });
  }

  const endTimeUTC = new Date(startTimeUTC.getTime() + 60 * 60 * 1000);

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin) return NextResponse.json({ error: "Admin tidak ditemukan." }, { status: 404 });

  const created = await prisma.attendanceSession.create({
    data: {
      title,
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      latitude,
      longitude,
      radius,
      createdById: admin.id,
    },
  });

  console.info("[audit] attendance.session.create", {
    adminId: admin.id,
    sessionId: created.id,
    title: created.title,
  });

  return NextResponse.json(created);
}

