import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import CheckinClient from "@/components/dashboard/student/checkin-client";
import AttendanceDataTable from "@/components/dashboard/admin/attendance-data-table";
import { formatWIB, formatWIBTimeOnly } from "@/lib/shared/time";
import {
  MapPin,
  Clock,
  Calendar,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

type AttendanceSessionDetailProps = {
  params: { sessionId: string };
  basePath: string;
  allowedRole?: "ADMIN" | "STUDENT";
};

type AttendanceRow = {
  nim: string;
  name: string;
  status: "HADIR" | "IZIN" | "TIDAK_HADIR" | "BELUM";
  attendedAt: Date | null;
};

function getSessionStatus(
  now: Date,
  startTime: Date,
  endTime: Date
): { label: string; tone: "active" | "upcoming" | "expired"; icon: React.ReactNode } {
  if (now < startTime) {
    return { label: "Akan datang", tone: "upcoming", icon: <Calendar className="h-3 w-3" /> };
  }
  if (now > endTime) {
    return { label: "Berakhir", tone: "expired", icon: <XCircle className="h-3 w-3" /> };
  }
  return { label: "Aktif", tone: "active", icon: <Clock className="h-3 w-3" /> };
}

export default async function AttendanceSessionDetail({
  params,
  basePath,
  allowedRole,
}: AttendanceSessionDetailProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const role = session.user.role ?? "STUDENT";
  if (allowedRole && role !== allowedRole) {
    const fallbackPath = allowedRole === "ADMIN"
      ? "/dashboard/student/attendance"
      : "/dashboard/admin/attendance";
    redirect(fallbackPath);
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: params.sessionId },
  });
  if (!attendanceSession) notFound();

  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_sessionId: { userId: user.id, sessionId: attendanceSession.id } },
  });

  const now = new Date();
  const isActive = now >= attendanceSession.startTime && now <= attendanceSession.endTime;
  const isExpired = now > attendanceSession.endTime;
  const { label, tone, icon: statusIcon } = getSessionStatus(
    now,
    attendanceSession.startTime,
    attendanceSession.endTime
  );

  let attendanceRows: AttendanceRow[] = [];
  if (role === "ADMIN") {
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

    const recordByNim = new Map<string, typeof records[number]>();
    records.forEach((recordItem) => {
      if (recordItem.user.nim) {
        recordByNim.set(recordItem.user.nim, recordItem);
      }
    });

    attendanceRows = roster.map((student) => {
      const recordItem = recordByNim.get(student.nim);
      const status = recordItem?.status ?? (isExpired ? "TIDAK_HADIR" : "BELUM");
      return {
        nim: student.nim,
        name: student.fullName ?? "-",
        status,
        attendedAt: recordItem?.attendedAt ?? null,
      };
    });
  }

  const hadirCount = attendanceRows.filter((row) => row.status === "HADIR").length;
  const izinCount = attendanceRows.filter((row) => row.status === "IZIN").length;
  const tidakHadirCount = attendanceRows.filter((row) => row.status === "TIDAK_HADIR").length;
  const belumCount = attendanceRows.filter((row) => row.status === "BELUM").length;
  const tableRows = attendanceRows.map((row) => ({
    nim: row.nim,
    name: row.name,
    status: row.status,
    attendedAtLabel: row.attendedAt ? formatWIB(row.attendedAt) : "-",
  }));

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 text-sm text-fd-muted-foreground hover:text-fd-foreground sm:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-fd-foreground">
              {attendanceSession.title}
            </h1>
            <span className="status-chip" data-tone={tone}>
              {statusIcon}
              {label}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-fd-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>
                {formatWIB(attendanceSession.startTime)} - {formatWIBTimeOnly(attendanceSession.endTime)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-fd-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>Radius: {attendanceSession.radius} meter</span>
            </div>
          </div>

          {role === "ADMIN" && (
            <div className="mt-4 rounded-lg border border-fd-border bg-fd-background px-4 py-3">
              <p className="text-sm text-fd-muted-foreground">
                <span className="font-semibold text-fd-foreground">Rekap:</span>{" "}
                Hadir {hadirCount} · Izin {izinCount} · Tidak hadir {tidakHadirCount} ·{" "}
                {isExpired ? "Belum tercatat" : "Belum presensi"} {belumCount}
              </p>
            </div>
          )}
        </div>

        {role !== "ADMIN" && label === "Aktif" && !record && (
          <div className="flex items-start gap-2 rounded-lg border border-fd-border bg-fd-muted p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-fd-foreground" />
            <span className="text-fd-foreground">
              Aktifkan izin lokasi agar presensi berjalan.
            </span>
          </div>
        )}

        {role === "ADMIN" ? (
          <div className="rounded-xl border border-fd-border bg-fd-card shadow-sm overflow-x-auto">
            <div className="p-6 min-w-full">
              <AttendanceDataTable
                sessionId={attendanceSession.id}
                rows={tableRows}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
            <CheckinClient
              sessionId={attendanceSession.id}
              isActive={isActive}
              alreadyCheckedIn={Boolean(record)}
            />
          </div>
        )}

        {role !== "ADMIN" && record && (
          <div className="flex items-center justify-center gap-2 rounded-md bg-fd-muted px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-[color:var(--color-fd-success)]" />
            <span className="text-sm font-medium text-fd-foreground">
              Anda sudah presensi ({record.status})
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
