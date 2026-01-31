import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { ok, unauthorized, forbidden } from "@/lib/shared/api/response";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const now = new Date();

  const [activeCount, upcomingCount, expiredCount, studentCount, recentSessions, attendanceStats] =
    await Promise.all([
      prisma.attendanceSession.count({
        where: { startTime: { lte: now }, endTime: { gte: now } },
      }),
      prisma.attendanceSession.count({
        where: { startTime: { gt: now } },
      }),
      prisma.attendanceSession.count({
        where: { endTime: { lt: now } },
      }),
      prisma.studentRoster.count(),
      prisma.attendanceSession.findMany({
        orderBy: { startTime: "asc" },
        take: 7,
        select: {
          id: true,
          title: true,
          startTime: true,
          _count: {
            select: { records: true },
          },
        },
      }),
      prisma.attendanceRecord.groupBy({
        by: ["sessionId"],
        where: {
          status: "HADIR",
        },
        _count: true,
      }),
    ]);

  const hadirBySession = new Map(
    attendanceStats.map((s) => [s.sessionId, s._count])
  );

  const chartData = recentSessions.map((s) => ({
    date: new Date(s.startTime).toISOString(),
    title: s.title,
    label: new Date(s.startTime).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
    total: s._count.records,
    hadir: hadirBySession.get(s.id) ?? 0,
  }));

  return ok({
    stats: {
      activeCount,
      upcomingCount,
      expiredCount,
      studentCount,
      totalSessions: activeCount + upcomingCount + expiredCount,
    },
    chartData,
  });
}
