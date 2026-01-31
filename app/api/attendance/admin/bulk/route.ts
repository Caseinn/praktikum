import { createHash } from "crypto";
import { auth } from "@/lib/core/auth";
import { attendanceService } from "@/lib/features/attendance/service";
import { checkRateLimit, getRateLimitKey } from "@/lib/core/rate-limit";
import { ok, error, unauthorized, forbidden, notFound } from "@/lib/shared/api/response";
import { validateBody } from "@/lib/shared/api/validation";
import { bulkAttendanceSchema } from "@/lib/validations/schemas";

const MAX_BODY_BYTES = 100_000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const limitKey = getRateLimitKey(req, "attendance-bulk", session.user.email);
  const limit = await checkRateLimit(limitKey, { windowMs: 60_000, max: 15 });
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
    return error("Payload tidak valid.", 400);
  }

  const validation = validateBody(bulkAttendanceSchema, body);
  if (!validation.success) return validation.response;

  const { sessionId, status, nims } = validation.data;

  const result = await attendanceService.bulkUpdateAttendance(sessionId, status, nims, session.user.email);

  if (result.success) {
    const adminHash = session.user.email
      ? createHash("sha256").update(session.user.email).digest("hex")
      : null;

    console.info("[audit] attendance.bulk", {
      adminHash,
      sessionId,
      status,
      updated: result.data?.updated,
    });

    return ok({ updated: result.data?.updated, missing: result.data?.missing });
  }

  if (result.code === "SESSION_NOT_FOUND") {
    return notFound("Sesi presensi tidak ditemukan.");
  }

  if (result.code === "USERS_NOT_FOUND") {
    return notFound("Pengguna dengan NIM tersebut tidak ditemukan.");
  }

  return error(result.error!, result.code === "EMPTY_NIMS" || result.code === "TOO_MANY_NIMS" ? 400 : 500, result.code);
}
