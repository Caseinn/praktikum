import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { haversineDistanceMeters } from "@/lib/core/geo";
import { consumeCheckinNonce } from "@/lib/checkin-nonce";
import { checkRateLimit, getRateLimitKey } from "@/lib/core/rate-limit";
import { ok, unauthorized, forbidden, error, notFound, badRequest } from "@/lib/shared/api/response";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "STUDENT") return forbidden();

  const limitKey = getRateLimitKey(req, "attendance-checkin", session.user.email);
  const limit = await checkRateLimit(limitKey, { windowMs: 60_000, max: 10 });
  if (!limit.ok) {
    return error("Terlalu banyak permintaan.", 429, "RATE_LIMIT");
  }

  const body = await req.json();
  const { sessionId, nonce, latitude, longitude } = body as {
    sessionId?: string;
    nonce?: string;
    latitude?: number;
    longitude?: number;
  };

  if (!sessionId || typeof sessionId !== "string") {
    return badRequest("Session ID wajib diisi.");
  }

  if (!nonce || typeof nonce !== "string") {
    return badRequest("Nonce wajib diisi.");
  }

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return badRequest("Koordinat wajib berupa angka.");
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return notFound("Pengguna tidak ditemukan.");
  if (!user.nim) {
    return badRequest("NIM tidak terdeteksi dari email.");
  }

  const roster = await prisma.studentRoster.findUnique({
    where: { nim: user.nim },
    select: { isActive: true },
  });
  if (!roster?.isActive) {
    return forbidden("Mahasiswa tidak aktif.");
  }

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });
  if (!attendanceSession) {
    return notFound("Sesi presensi tidak ditemukan.");
  }

  const now = new Date();
  if (now < attendanceSession.startTime || now > attendanceSession.endTime) {
    return badRequest("Sesi presensi belum aktif atau sudah berakhir.");
  }

  const nonceValid = await consumeCheckinNonce(user.id, attendanceSession.id, nonce);
  if (!nonceValid) {
    return error("Token check-in tidak valid atau kedaluwarsa.", 403, "INVALID_NONCE");
  }

  const dist = haversineDistanceMeters(
    latitude,
    longitude,
    attendanceSession.latitude,
    attendanceSession.longitude
  );

  if (dist > attendanceSession.radius) {
    return error(`Di luar area presensi (${Math.round(dist)}m).`, 403, "OUT_OF_RANGE");
  }

  try {
    await prisma.attendanceRecord.create({
      data: { userId: user.id, sessionId: attendanceSession.id, status: "HADIR" },
    });
  } catch {
    return error("Sudah presensi untuk sesi ini.", 409, "ALREADY_CHECKED_IN");
  }

  return ok({ distance: Math.round(dist) });
}
