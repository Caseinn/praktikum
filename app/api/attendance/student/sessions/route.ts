import { auth } from "@/lib/core/auth";
import { attendanceService } from "@/lib/features/attendance/service";
import { ok, unauthorized } from "@/lib/shared/api/response";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();

  const sessions = await attendanceService.getSessions("STUDENT");
  return ok(sessions);
}
