import { auth } from "@/lib/core/auth";
import { attendanceService } from "@/lib/features/attendance/service";
import { checkRateLimit, getRateLimitKey } from "@/lib/core/rate-limit";
import { ok, created, error, unauthorized, forbidden, badRequest } from "@/lib/shared/api/response";

const MAX_BODY_BYTES = 20_000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const sessions = await attendanceService.getSessions("ADMIN");
  return ok(sessions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const limitKey = getRateLimitKey(req, "attendance-sessions-create", session.user.email);
  const limit = await checkRateLimit(limitKey, { windowMs: 60_000, max: 10 });
  if (!limit.ok) {
    return error("Terlalu banyak permintaan.", 429, "RATE_LIMIT");
  }

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return error("Payload terlalu besar.", 413, "PAYLOAD_TOO_LARGE");
  }

  let body: unknown;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return badRequest("Payload tidak valid.");
  }

  const { title, startTime, latitude, longitude, radius } = body as {
    title?: string;
    startTime?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  };

  if (!title || typeof title !== "string") {
    return badRequest("Judul wajib diisi.");
  }

  if (!startTime || typeof startTime !== "string") {
    return badRequest("Waktu mulai wajib diisi.");
  }

  if (typeof latitude !== "number" || typeof longitude !== "number" || typeof radius !== "number") {
    return badRequest("Koordinat dan radius wajib berupa angka.");
  }

  const admin = await auth();
  if (!admin?.user?.email) return unauthorized();

  const result = await attendanceService.createSession(
    { title, startTime, latitude, longitude, radius },
    admin.user.id
  );

  if (result.success) {
    return created(result.data, "Sesi presensi berhasil dibuat.");
  }

  return error(result.error!, result.code === "INVALID_TIME" ? 400 : 500, result.code);
}
