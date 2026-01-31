import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { ok, notFound, unauthorized, forbidden } from "@/lib/shared/api/response";
import { formatWIB } from "@/lib/shared/time";

type AttendanceRow = {
  nim: string;
  name: string;
  status: "HADIR" | "IZIN" | "TIDAK_HADIR" | "BELUM";
  attendedAtLabel: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const { sessionId } = await params;

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      radius: true,
    },
  });

  if (!attendanceSession) return notFound("Sesi tidak ditemukan.");

  const now = new Date();
  const isExpired = now > attendanceSession.endTime;

  const [roster, records] = await Promise.all([
    prisma.studentRoster.findMany({
      where: { isActive: true },
      orderBy: { nim: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { sessionId: attendanceSession.id },
      include: { user: true },
    }),
  ]);

  const recordByNim = new Map<string, (typeof records)[number]>();
  records.forEach((recordItem) => {
    if (recordItem.user.nim) {
      recordByNim.set(recordItem.user.nim, recordItem);
    }
  });

  const rows: AttendanceRow[] = roster.map((student) => {
    const recordItem = recordByNim.get(student.nim);
    const status = recordItem?.status ?? (isExpired ? "TIDAK_HADIR" : "BELUM");
    return {
      nim: student.nim,
      name: student.fullName ?? "-",
      status,
      attendedAtLabel: recordItem?.attendedAt ? formatWIB(recordItem.attendedAt) : "-",
    };
  });

  const hadirCount = rows.filter((row) => row.status === "HADIR").length;
  const izinCount = rows.filter((row) => row.status === "IZIN").length;
  const tidakHadirCount = rows.filter((row) => row.status === "TIDAK_HADIR").length;
  const belumCount = rows.filter((row) => row.status === "BELUM").length;

  return ok({
    session: {
      id: attendanceSession.id,
      title: attendanceSession.title,
      startTime: attendanceSession.startTime.toISOString(),
      endTime: attendanceSession.endTime.toISOString(),
      radius: attendanceSession.radius,
      isExpired,
    },
    stats: {
      hadirCount,
      izinCount,
      tidakHadirCount,
      belumCount,
    },
    rows,
  });
}
