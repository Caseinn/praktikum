import Link from "next/link";
import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { redirect } from "next/navigation";
import {
  Calendar,
  Users,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import AccessDenied from "@/components/shared/access-denied";
import { SessionChart } from "@/components/dashboard/session-chart";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return <AccessDenied backHref="/dashboard" backLabel="Kembali" />;
  }

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

  const totalSessions = activeCount + upcomingCount + expiredCount;

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

  return (
    <main className="space-y-8 p-4 sm:p-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Total Sesi
            </p>
            <Calendar className="h-5 w-5 text-fd-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-foreground">{totalSessions}</p>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Aktif
            </p>
            <CheckCircle2 className="h-5 w-5 text-fd-success" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-success">{activeCount}</p>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Akan Datang
            </p>
            <Clock className="h-5 w-5 text-fd-warning" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-warning">{upcomingCount}</p>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Berakhir
            </p>
            <XCircle className="h-5 w-5 text-fd-error" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-error">{expiredCount}</p>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Total Mhs
            </p>
            <Users className="h-5 w-5 text-fd-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-foreground">{studentCount}</p>
        </div>
      </section>

      <section className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fd-primary/10">
            <TrendingUp className="h-5 w-5 text-fd-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-fd-foreground">Kehadiran per Sesi</h2>
            <p className="text-sm text-fd-muted-foreground">
              Jumlah mahasiswa yang hadir pada sesi terakhir.
            </p>
          </div>
        </div>
        <SessionChart data={chartData} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/admin/attendance"
          className="group relative overflow-hidden rounded-xl border border-fd-border bg-fd-card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fd-primary/10">
                <Calendar className="h-5 w-5 text-fd-primary" />
              </div>
              <h3 className="text-lg font-semibold text-fd-foreground">Kelola Sesi</h3>
            </div>
            <p className="mt-2 text-sm text-fd-muted-foreground">
              Buat dan kelola sesi presensi mahasiswa.
            </p>
          </div>
          <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-fd-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/dashboard/admin/students"
          className="group relative overflow-hidden rounded-xl border border-fd-border bg-fd-card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fd-primary/10">
                <Users className="h-5 w-5 text-fd-primary" />
              </div>
              <h3 className="text-lg font-semibold text-fd-foreground">Kelola Mahasiswa</h3>
            </div>
            <p className="mt-2 text-sm text-fd-muted-foreground">
              Kelola data mahasiswa terdaftar.
            </p>
          </div>
          <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-fd-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/dashboard/admin/export"
          className="group relative overflow-hidden rounded-xl border border-fd-border bg-fd-card p-6 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fd-primary/10">
                <FileSpreadsheet className="h-5 w-5 text-fd-primary" />
              </div>
              <h3 className="text-lg font-semibold text-fd-foreground">Export Data</h3>
            </div>
            <p className="mt-2 text-sm text-fd-muted-foreground">
              Unduh laporan kehadiran dalam CSV.
            </p>
          </div>
          <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-fd-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </main>
  );
}
