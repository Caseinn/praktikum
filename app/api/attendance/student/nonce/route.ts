import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { issueCheckinNonce } from "@/lib/checkin-nonce";
import { checkRateLimit, getRateLimitKey } from "@/lib/core/rate-limit";
import { ok, unauthorized, forbidden, error, notFound, badRequest } from "@/lib/shared/api/response";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "STUDENT") return forbidden();

  const limitKey = getRateLimitKey(req, "attendance-checkin-nonce", session.user.email);
  const limit = await checkRateLimit(limitKey, { windowMs: 60_000, max: 30 });
  if (!limit.ok) {
    return error("Terlalu banyak permintaan.", 429, "RATE_LIMIT");
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";
  if (!sessionId) {
    return badRequest("Session ID wajib diisi.");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, nim: true },
  });
  if (!user) {
    return notFound("Pengguna tidak ditemukan.");
  }
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
    select: { id: true, startTime: true, endTime: true },
  });
  if (!attendanceSession) {
    return notFound("Sesi presensi tidak ditemukan.");
  }

  const now = new Date();
  if (now < attendanceSession.startTime || now > attendanceSession.endTime) {
    return badRequest("Sesi presensi belum aktif atau sudah berakhir.");
  }

  const nonce = await issueCheckinNonce(user.id, attendanceSession.id);
  const res = ok({ nonce });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
