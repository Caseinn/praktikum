import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Clock,
  Calendar,
  XCircle,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { formatWIB, formatWIBTimeOnly } from "@/lib/time";
import AccessDenied from "@/components/shared/access-denied";
import { CreateSessionDialog } from "@/components/dashboard/attendance/create-session-dialog";

type SessionStatus = "ACTIVE" | "UPCOMING" | "EXPIRED";

function getStatus(now: Date, startTime: Date, endTime: Date): SessionStatus {
  if (now < startTime) return "UPCOMING";
  if (now > endTime) return "EXPIRED";
  return "ACTIVE";
}

export default async function AdminAttendancePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return <AccessDenied backHref="/dashboard" backLabel="Kembali" />;
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const sessions = await prisma.attendanceSession.findMany({
    orderBy: { startTime: "desc" },
    take: 50,
  });

  const now = new Date();

  const stats = {
    active: sessions.filter((s) => getStatus(now, s.startTime, s.endTime) === "ACTIVE").length,
    upcoming: sessions.filter((s) => getStatus(now, s.startTime, s.endTime) === "UPCOMING").length,
    expired: sessions.filter((s) => getStatus(now, s.startTime, s.endTime) === "EXPIRED").length,
  };

  return (
    <main className="space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-3">
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Aktif</p>
            <CheckCircle2 className="h-4 w-4 text-fd-success flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-success">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Akan Datang</p>
            <Clock className="h-4 w-4 text-fd-warning flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-warning">{stats.upcoming}</p>
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Berakhir</p>
            <XCircle className="h-4 w-4 text-fd-error flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-error">{stats.expired}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <CreateSessionDialog />
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="rounded-xl border border-fd-border bg-fd-card p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-fd-muted-foreground" />
            <p className="mt-2 text-sm text-fd-muted-foreground">Belum ada sesi presensi.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sessions.map((s) => {
              const status = getStatus(now, s.startTime, s.endTime);
              const statusConfig = {
                ACTIVE: { label: "Aktif", icon: Clock, color: "success" },
                UPCOMING: { label: "Akan datang", icon: Calendar, color: "warning" },
                EXPIRED: { label: "Berakhir", icon: XCircle, color: "error" },
              };
              const config = statusConfig[status];
              const Icon = config.icon;

              return (
                <a
                  key={s.id}
                  href={`/dashboard/admin/attendance/${s.id}`}
                  className="group relative overflow-hidden rounded-xl border border-fd-border bg-fd-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-fd-foreground group-hover:text-fd-primary transition-colors">
                          {s.title}
                        </h3>
                        <div className="mt-3 space-y-2 text-sm text-fd-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>
                              {formatWIB(s.startTime)} - {formatWIBTimeOnly(s.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>Radius: {s.radius} meter</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`status-chip shrink-0 data-tone=${
                          config.color === "success" ? "active" : config.color === "warning" ? "upcoming" : "expired"
                        }`}
                        data-tone={config.color === "success" ? "active" : config.color === "warning" ? "upcoming" : "expired"}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
