import Link from "next/link";
import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { redirect } from "next/navigation";
import { CalendarCheck, ArrowRight, History, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatWIB } from "@/lib/shared/time";

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      attendance: {
        include: { session: true },
        orderBy: { attendedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user?.nim) {
    return (
      <main className="p-4 sm:p-6 animate-fade-up">
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 text-sm text-fd-foreground">
          NIM tidak terdeteksi dari email.
        </div>
      </main>
    );
  }

  const now = new Date();
  const pastSessions = await prisma.attendanceSession.findMany({
    where: { endTime: { lt: now } },
  });

  const totalSesiLalu = pastSessions.length;
  const pastSessionIds = new Set(pastSessions.map((s) => s.id));
  const pastAttendance = user.attendance.filter((a) => pastSessionIds.has(a.sessionId));
  const hadirCount = pastAttendance.filter((a) => a.status === "HADIR").length;
  const izinCount = pastAttendance.filter((a) => a.status === "IZIN").length;
  const tidakHadirCount = Math.max(totalSesiLalu - hadirCount - izinCount, 0);

  return (
    <main className="space-y-6 p-4 sm:p-6 animate-fade-up">
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

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/student/attendance"
          className="flex items-center justify-between gap-3 rounded-xl border border-fd-border bg-fd-card p-4 text-sm font-medium text-fd-foreground transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Presensi
          </span>
          <ArrowRight className="h-4 w-4 text-fd-muted-foreground" />
        </Link>
        <Link
          href="/dashboard/student/history"
          className="flex items-center justify-between gap-3 rounded-xl border border-fd-border bg-fd-card p-4 text-sm font-medium text-fd-foreground transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Riwayat
          </span>
          <ArrowRight className="h-4 w-4 text-fd-muted-foreground" />
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-fd-foreground">Riwayat Presensi</h2>
        {user.attendance.length === 0 ? (
          <div className="rounded-xl border border-fd-border bg-fd-card p-6 text-center">
            <CalendarCheck className="mx-auto h-8 w-8 text-fd-muted-foreground" />
            <p className="mt-2 text-sm text-fd-muted-foreground">Belum ada presensi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {user.attendance.map((a) => {
              const tone =
                a.status === "HADIR"
                  ? "active"
                  : a.status === "IZIN"
                  ? "notice"
                  : "expired";
              const label =
                a.status === "HADIR"
                  ? "Hadir"
                  : a.status === "IZIN"
                  ? "Izin"
                  : "Tidak hadir";

              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-fd-border bg-fd-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 text-fd-muted-foreground">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-fd-foreground">{a.session.title}</p>
                      <p className="text-xs text-fd-muted-foreground">
                        {formatWIB(a.attendedAt)}
                      </p>
                    </div>
                  </div>
                  <span className="status-chip" data-tone={tone}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
