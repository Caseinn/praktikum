"use client";

import { usePolling } from "@/lib/hooks/use-polling";
import { useCallback } from "react";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { SessionChart } from "@/components/dashboard/session-chart";

interface DashboardStats {
  activeCount: number;
  upcomingCount: number;
  expiredCount: number;
  studentCount: number;
  totalSessions: number;
}

interface ChartDataItem {
  date: string;
  title: string;
  label: string;
  total: number;
  hadir: number;
}

interface DashboardStatsResponse {
  stats: DashboardStats;
  chartData: ChartDataItem[];
}

interface DashboardStatsPollingProps {
  initialStats: DashboardStats;
  initialChartData: ChartDataItem[];
}

export function DashboardStatsPolling({
  initialStats,
  initialChartData,
}: DashboardStatsPollingProps) {
  const fetcher = useCallback(async (): Promise<DashboardStatsResponse> => {
    const res = await fetch("/api/attendance/admin/stats");
    if (!res.ok) throw new Error("Failed to fetch stats");
    const json = await res.json();
    return json.data;
  }, []);

  const { data } = usePolling<DashboardStatsResponse>({
    fetcher,
    interval: 10000,
    enabled: true,
  });

  const stats = data?.stats ?? initialStats;
  const chartData = data?.chartData ?? initialChartData;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Total Sesi
            </p>
            <Calendar className="h-5 w-5 text-fd-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-foreground">{stats.totalSessions}</p>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Aktif
            </p>
            <CheckCircle2 className="h-5 w-5 text-fd-success" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-success">{stats.activeCount}</p>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Akan Datang
            </p>
            <Clock className="h-5 w-5 text-fd-warning" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-warning">{stats.upcomingCount}</p>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Berakhir
            </p>
            <XCircle className="h-5 w-5 text-fd-error" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-error">{stats.expiredCount}</p>
        </div>

        <div className="rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
              Total Mhs
            </p>
            <Users className="h-5 w-5 text-fd-muted-foreground" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-fd-foreground">{stats.studentCount}</p>
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
    </>
  );
}
