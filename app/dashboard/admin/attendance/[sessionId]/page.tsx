import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { SessionDetailPolling } from "@/components/dashboard/admin/session-detail-polling";
import { formatWIB, formatWIBTimeOnly } from "@/lib/shared/time";
import {
  MapPin,
  Clock,
  Calendar,
  XCircle,
  ArrowLeft,
} from "lucide-react";

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
    return { label: "Akan datang", tone: "upcoming", icon: <Calendar className="h-4 w-4" /> };
  }
  if (now > endTime) {
    return { label: "Berakhir", tone: "expired", icon: <XCircle className="h-4 w-4" /> };
  }
  return { label: "Aktif", tone: "active", icon: <Clock className="h-4 w-4" /> };
}

export default async function AdminAttendanceSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const role = session.user.role ?? "STUDENT";
  if (role !== "ADMIN") {
    redirect("/dashboard/student/attendance");
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const resolvedParams = await params;
  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: resolvedParams.sessionId },
  });
  if (!attendanceSession) notFound();

  const now = new Date();
  const isExpired = now > attendanceSession.endTime;
  const { label, tone, icon: statusIcon } = getSessionStatus(
    now,
    attendanceSession.startTime,
    attendanceSession.endTime
  );

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

  const attendanceRows: AttendanceRow[] = roster.map((student) => {
    const recordItem = recordByNim.get(student.nim);
    const status = recordItem?.status ?? (isExpired ? "TIDAK_HADIR" : "BELUM");
    return {
      nim: student.nim,
      name: student.fullName ?? "-",
      status,
      attendedAt: recordItem?.attendedAt ?? null,
    };
  });

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

  const initialStats = {
    hadirCount,
    izinCount,
    tidakHadirCount,
    belumCount,
  };

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <Link
        href="/dashboard/admin/attendance"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-fd-muted-foreground hover:text-fd-foreground sm:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Session Header */}
        <div className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold text-fd-foreground">
                  {attendanceSession.title}
                </h1>
                <span className={`status-chip data-tone=${tone}`} data-tone={tone}>
                  {statusIcon}
                  {label}
                </span>
              </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-fd-border bg-fd-background p-4">
              <Clock className="h-5 w-5 text-fd-muted-foreground" />
              <div>
                <p className="text-xs text-fd-muted-foreground">Waktu</p>
                <p className="text-sm font-medium text-fd-foreground">
                  {formatWIB(attendanceSession.startTime)} - {formatWIBTimeOnly(attendanceSession.endTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-fd-border bg-fd-background p-4">
              <MapPin className="h-5 w-5 text-fd-muted-foreground" />
              <div>
                <p className="text-xs text-fd-muted-foreground">Lokasi</p>
                <p className="text-sm font-medium text-fd-foreground">
                  Radius: {attendanceSession.radius} meter
                </p>
              </div>
            </div>
          </div>

          <SessionDetailPolling
            sessionId={attendanceSession.id}
            initialStats={initialStats}
            initialRows={tableRows}
            isExpired={isExpired}
          />
        </div>
      </div>
    </main>
  );
}
