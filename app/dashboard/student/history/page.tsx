import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CalendarCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatWIB, formatWIBTimeOnly } from "@/lib/time";

export default async function StudentHistoryPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/dashboard/admin");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      attendance: {
        include: { session: true },
        orderBy: { attendedAt: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  const now = new Date();
  const pastSessions = await prisma.attendanceSession.findMany({
    where: { endTime: { lt: now } },
    orderBy: { startTime: "desc" },
  });

  const pastSessionIds = new Set(pastSessions.map((s) => s.id));
  const userAttendanceBySession = new Map(
    user.attendance
      .filter((a) => pastSessionIds.has(a.sessionId))
      .map((a) => [a.sessionId, a])
  );

  const totalSesi = pastSessions.length;
  let hadirCount = 0;
  let izinCount = 0;
  let tidakHadirCount = 0;

  const sessionHistory = pastSessions.map((session) => {
    const attendance = userAttendanceBySession.get(session.id);
    const status = attendance?.status ?? "TIDAK_HADIR";
    const attendedAt = attendance?.attendedAt ?? null;

    if (status === "HADIR") hadirCount++;
    else if (status === "IZIN") izinCount++;
    else tidakHadirCount++;

    return {
      session,
      status,
      attendedAt,
    };
  });

  return (
    <main className="relative space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-3">
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Hadir</p>
            <CheckCircle2 className="h-4 w-4 text-fd-success flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-success">{hadirCount}</p>
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Izin</p>
            <Clock className="h-4 w-4 text-fd-warning flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-warning">{izinCount}</p>
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Tidak Hadir</p>
            <XCircle className="h-4 w-4 text-fd-error flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-error">{tidakHadirCount}</p>
        </div>
      </div>

      <div className="space-y-4">
        {sessionHistory.length === 0 ? (
          <div className="rounded-xl border border-fd-border bg-fd-card p-8 text-center">
            <CalendarCheck className="mx-auto h-8 w-8 text-fd-muted-foreground" />
            <p className="mt-2 text-sm text-fd-muted-foreground">
              belum ada sesi presensi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionHistory.map(({ session, status, attendedAt }) => {
              const isHadir = status === "HADIR";
              const isIzin = status === "IZIN";

              return (
                <div
                  key={session.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-fd-border bg-fd-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                        isHadir
                          ? "bg-fd-success/10 text-fd-success"
                          : isIzin
                          ? "bg-fd-warning/10 text-fd-warning"
                          : "bg-fd-error/10 text-fd-error"
                      }`}
                    >
                      {isHadir ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isIzin ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-fd-foreground">
                        {session.title}
                      </p>
                      <p className="text-xs text-fd-muted-foreground">
                        {formatWIB(session.startTime)} - {formatWIBTimeOnly(session.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`status-chip ${
                        isHadir
                          ? "data-tone=active"
                          : isIzin
                          ? "data-tone=notice"
                          : "data-tone=expired"
                      }`}
                      data-tone={isHadir ? "active" : isIzin ? "notice" : "expired"}
                    >
                      {status === "HADIR"
                        ? "Hadir"
                        : status === "IZIN"
                        ? "Izin"
                        : "Tidak Hadir"}
                    </span>
                    <span className="text-xs text-fd-muted-foreground">
                      {attendedAt ? formatWIB(attendedAt) : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
