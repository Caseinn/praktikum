"use client";

import { useQuery } from "@tanstack/react-query";
import { getSessionDetail, type AttendanceTableRow } from "@/lib/actions/admin";
import AttendanceDataTable from "@/components/dashboard/admin/attendance-data-table";

interface SessionStats {
  hadirCount: number;
  izinCount: number;
  tidakHadirCount: number;
  belumCount: number;
}

interface SessionDetailPollingProps {
  sessionId: string;
  initialStats: SessionStats;
  initialRows: AttendanceTableRow[];
  isExpired: boolean;
}

export function SessionDetailPolling({
  sessionId,
  initialStats,
  initialRows,
  isExpired,
}: SessionDetailPollingProps) {
  const { data } = useQuery({
    queryKey: ["sessionDetail", sessionId],
    queryFn: () => getSessionDetail(sessionId),
    refetchInterval: 10000,
  });

  const stats = data?.stats ?? initialStats;
  const rows = data?.rows ?? initialRows;
  const currentIsExpired = data?.session?.isExpired ?? isExpired;

  return (
    <>
      <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-lg border border-fd-border bg-fd-success/10 p-3 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-fd-success">Hadir</p>
          <p className="mt-1 text-2xl font-semibold text-fd-success">{stats.hadirCount}</p>
        </div>
        <div className="rounded-lg border border-fd-border bg-fd-warning/10 p-3 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-fd-warning">Izin</p>
          <p className="mt-1 text-2xl font-semibold text-fd-warning">{stats.izinCount}</p>
        </div>
        <div className="rounded-lg border border-fd-border bg-fd-error/10 p-3 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-fd-error">Tidak Hadir</p>
          <p className="mt-1 text-2xl font-semibold text-fd-error">{stats.tidakHadirCount}</p>
        </div>
        <div className="rounded-lg border border-fd-border bg-fd-muted p-3 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
            {currentIsExpired ? "Belum Tercatat" : "Belum Presensi"}
          </p>
          <p className="mt-1 text-2xl font-semibold text-fd-foreground">{stats.belumCount}</p>
        </div>
      </div>

      <div className="mt-6 min-w-full">
        <AttendanceDataTable sessionId={sessionId} rows={rows} />
      </div>
    </>
  );
}
