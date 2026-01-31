import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistanceMeters } from "@/lib/geo";
import { consumeCheckinNonce } from "@/lib/checkin-nonce";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { checkinSchema } from "@/lib/validations/schemas";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const limitKey = getRateLimitKey(req, "attendance-checkin", session.user.email);
  const limit = await checkRateLimit(limitKey, { windowMs: 60_000, max: 10 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await req.json();
  const parse = checkinSchema.safeParse(body);

  if (!parse.success) {
    const errors = parse.error.issues.map((e) => e.message);
    return NextResponse.json({ error: errors[0] || "Input tidak valid." }, { status: 400 });
  }

  const { sessionId, nonce, latitude, longitude } = parse.data;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  if (!user.nim) {
    return NextResponse.json({ error: "NIM tidak terdeteksi dari email." }, { status: 400 });
  }

  const roster = await prisma.studentRoster.findUnique({
    where: { nim: user.nim },
    select: { isActive: true },
  });
  if (!roster?.isActive) {
    return NextResponse.json({ error: "Mahasiswa tidak aktif." }, { status: 403 });
  }

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });
  if (!attendanceSession) {
    return NextResponse.json({ error: "Sesi presensi tidak ditemukan." }, { status: 404 });
  }

  const now = new Date();
  if (now < attendanceSession.startTime || now > attendanceSession.endTime) {
    return NextResponse.json(
      { error: "Sesi presensi belum aktif atau sudah berakhir." },
      { status: 400 }
    );
  }

  const nonceValid = await consumeCheckinNonce(user.id, attendanceSession.id, nonce);
  if (!nonceValid) {
    return NextResponse.json(
      { error: "Token check-in tidak valid atau kedaluwarsa." },
      { status: 403 }
    );
  }

  const dist = haversineDistanceMeters(
    latitude,
    longitude,
    attendanceSession.latitude,
    attendanceSession.longitude
  );

  if (dist > attendanceSession.radius) {
    return NextResponse.json(
      { error: "Di luar area presensi.", distance: Math.round(dist) },
      { status: 403 }
    );
  }

  try {
    await prisma.attendanceRecord.create({
      data: { userId: user.id, sessionId: attendanceSession.id, status: "HADIR" },
    });
  } catch {
    return NextResponse.json({ error: "Sudah presensi untuk sesi ini." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, distance: Math.round(dist) });
}

