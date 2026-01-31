import Link from "next/link";
import { prisma } from "@/lib/core/prisma";
import { Clock, Calendar, XCircle, CheckCircle2, MapPin } from "lucide-react";
import { formatWIB, formatWIBTimeOnly } from "@/lib/shared/time";

type SessionStatus = "ACTIVE" | "UPCOMING" | "EXPIRED";

type AttendanceListProps = {
  role: "ADMIN" | "STUDENT";
  userId: string;
  basePath: string;
};

function getStatus(now: Date, startTime: Date, endTime: Date): SessionStatus {
  if (now < startTime) return "UPCOMING";
  if (now > endTime) return "EXPIRED";
  return "ACTIVE";
}

export default async function AttendanceList({
  role,
  userId,
  basePath,
}: AttendanceListProps) {
  const sessions = await prisma.attendanceSession.findMany({
    orderBy: { startTime: "desc" },
    take: 30,
  });

  const now = new Date();
  let attendedIds = new Set<string>();
  if (role !== "ADMIN" && sessions.length > 0) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        userId,
        sessionId: { in: sessions.map((s) => s.id) },
      },
      select: { sessionId: true },
    });
    attendedIds = new Set(records.map((r) => r.sessionId));
  }

  return (
    <main className="relative space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="space-y-4">
        {sessions.map((s) => {
          const status = getStatus(now, s.startTime, s.endTime);
          const alreadyChecked = attendedIds.has(s.id);

          const isUpcoming = status === "UPCOMING";
          const isExpired = status === "EXPIRED";
          const isActive = status === "ACTIVE";

          return (
            <div
              key={s.id}
              className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-fd-foreground">{s.title}</h2>
                    {role === "ADMIN" && (
                      <>
                        {isActive && (
                          <span className="status-chip" data-tone="active">
                            <Clock className="h-3 w-3" />
                            Aktif
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="status-chip" data-tone="upcoming">
                            <Calendar className="h-3 w-3" />
                            Akan datang
                          </span>
                        )}
                        {isExpired && (
                          <span className="status-chip" data-tone="expired">
                            <XCircle className="h-3 w-3" />
                            Berakhir
                          </span>
                        )}
                      </>
                    )}
                    {role !== "ADMIN" && isActive && !alreadyChecked && (
                      <span className="status-chip" data-tone="active">
                        <Clock className="h-3 w-3" />
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-fd-muted-foreground">
                    <p className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatWIB(s.startTime)} - {formatWIBTimeOnly(s.endTime)}
                    </p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Radius: {s.radius} meter
                    </p>
                  </div>
                </div>

                {role === "ADMIN" && (
                  <div className="mt-2 sm:mt-0">
                    <Link
                      href={`${basePath}/${s.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-3 py-1.5 text-sm font-medium text-fd-foreground transition hover:bg-fd-muted"
                    >
                      Detail
                    </Link>
                  </div>
                )}

                {role !== "ADMIN" && (
                  <div className="mt-2 sm:mt-0 flex flex-col items-end gap-2">
                    {isActive && (
                      <>
                        {alreadyChecked ? (
                          <span className="status-chip" data-tone="active">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Sudah Presensi
                          </span>
                        ) : (
                          <Link
                            href={`${basePath}/${s.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md bg-fd-primary px-3 py-1.5 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
                          >
                            Check-in
                          </Link>
                        )}
                      </>
                    )}
                    {isUpcoming && (
                      <span className="status-chip" data-tone="upcoming">
                        <Calendar className="h-3.5 w-3.5" />
                        Akan datang
                      </span>
                    )}
                    {isExpired && (
                      <span className="status-chip" data-tone="expired">
                        <XCircle className="h-3.5 w-3.5" />
                        Berakhir
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="rounded-xl border border-fd-border bg-fd-card p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-fd-muted-foreground" />
            <p className="mt-2 text-sm text-fd-muted-foreground">Belum ada sesi presensi.</p>
          </div>
        )}
      </div>
    </main>
  );
}
