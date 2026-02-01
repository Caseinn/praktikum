"use server";

import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { formatWIB } from "@/lib/shared/time";
import { revalidatePath } from "next/cache";
import { parseWIBDateTime } from "@/lib/shared/time";
import { haversineDistanceMeters } from "@/lib/core/geo";
import { issueCheckinNonce, consumeCheckinNonce } from "@/lib/checkin-nonce";
import { attendanceService } from "@/lib/features/attendance/service";
import type { ServiceResult } from "@/lib/features/service-types";

export interface DashboardStats {
  activeCount: number;
  upcomingCount: number;
  expiredCount: number;
  studentCount: number;
  totalSessions: number;
}

export interface ChartDataItem {
  date: string;
  title: string;
  label: string;
  total: number;
  hadir: number;
}

export interface AdminStatsResponse {
  stats: DashboardStats;
  chartData: ChartDataItem[];
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
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

  return {
    stats: {
      activeCount,
      upcomingCount,
      expiredCount,
      studentCount,
      totalSessions: activeCount + upcomingCount + expiredCount,
    },
    chartData,
  };
}

export interface SessionStats {
  hadirCount: number;
  izinCount: number;
  tidakHadirCount: number;
  belumCount: number;
}

export interface SessionDetailResponse {
  session: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    radius: number;
    isExpired: boolean;
  };
  stats: SessionStats;
  rows: AttendanceTableRow[];
}

export interface AttendanceTableRow {
  nim: string;
  name: string;
  status: "HADIR" | "IZIN" | "TIDAK_HADIR" | "BELUM";
  attendedAtLabel: string;
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      radius: true,
    },
  });

  if (!attendanceSession) {
    throw new Error("Sesi tidak ditemukan.");
  }

  const now = new Date();
  const isExpired = now > attendanceSession.endTime;

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

  const recordByNim = new Map<string, (typeof records)[number]>();
  records.forEach((recordItem) => {
    if (recordItem.user.nim) {
      recordByNim.set(recordItem.user.nim, recordItem);
    }
  });

  const rows: AttendanceTableRow[] = roster.map((student) => {
    const recordItem = recordByNim.get(student.nim);
    const status = recordItem?.status ?? (isExpired ? "TIDAK_HADIR" : "BELUM");
    return {
      nim: student.nim,
      name: student.fullName ?? "-",
      status,
      attendedAtLabel: recordItem?.attendedAt ? formatWIB(recordItem.attendedAt) : "-",
    };
  });

  const hadirCount = rows.filter((row) => row.status === "HADIR").length;
  const izinCount = rows.filter((row) => row.status === "IZIN").length;
  const tidakHadirCount = rows.filter((row) => row.status === "TIDAK_HADIR").length;
  const belumCount = rows.filter((row) => row.status === "BELUM").length;

  return {
    session: {
      id: attendanceSession.id,
      title: attendanceSession.title,
      startTime: attendanceSession.startTime.toISOString(),
      endTime: attendanceSession.endTime.toISOString(),
      radius: attendanceSession.radius,
      isExpired,
    },
    stats: {
      hadirCount,
      izinCount,
      tidakHadirCount,
      belumCount,
    },
    rows,
  };
}

export type SessionCreateInput = {
  title: string;
  startTime: string;
  latitude: number;
  longitude: number;
  radius: number;
};

export type SessionOutput = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  latitude: number;
  longitude: number;
  radius: number;
  createdById: string;
};

export async function createSession(
  input: SessionCreateInput
): Promise<ServiceResult<SessionOutput>> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };
  }

  const startTimeUTC = parseWIBDateTime(input.startTime);
  if (!startTimeUTC) {
    return { success: false, error: "Waktu mulai tidak valid.", code: "INVALID_TIME" };
  }

  const endTimeUTC = new Date(startTimeUTC.getTime() + 60 * 60 * 1000);

  try {
    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        title: input.title,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        latitude: input.latitude,
        longitude: input.longitude,
        radius: input.radius,
        createdById: session.user.id,
      },
    });

    revalidatePath("/dashboard/admin/attendance");

    return { success: true, data: attendanceSession };
  } catch {
    return { success: false, error: "Gagal membuat sesi.", code: "CREATE_FAILED" };
  }
}

export async function getCheckinNonce(sessionId: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "STUDENT") {
    throw new Error("Forbidden");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, nim: true },
  });
  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }
  if (!user.nim) {
    throw new Error("NIM tidak terdeteksi dari email.");
  }

  const roster = await prisma.studentRoster.findUnique({
    where: { nim: user.nim },
    select: { isActive: true },
  });
  if (!roster?.isActive) {
    throw new Error("Mahasiswa tidak aktif.");
  }

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { id: true, startTime: true, endTime: true },
  });
  if (!attendanceSession) {
    throw new Error("Sesi presensi tidak ditemukan.");
  }

  const now = new Date();
  if (now < attendanceSession.startTime || now > attendanceSession.endTime) {
    throw new Error("Sesi presensi belum aktif atau sudah berakhir.");
  }

  const nonce = await issueCheckinNonce(user.id, sessionId);
  return nonce;
}

export type CheckInResult = {
  success: boolean;
  error?: string;
  distance?: number;
};

export async function checkIn(
  sessionId: string,
  nonce: string,
  latitude: number,
  longitude: number
): Promise<CheckInResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }
  if (session.user.role !== "STUDENT") {
    return { success: false, error: "Forbidden" };
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return { success: false, error: "Pengguna tidak ditemukan." };
  }
  if (!user.nim) {
    return { success: false, error: "NIM tidak terdeteksi dari email." };
  }

  const roster = await prisma.studentRoster.findUnique({
    where: { nim: user.nim },
    select: { isActive: true },
  });
  if (!roster?.isActive) {
    return { success: false, error: "Mahasiswa tidak aktif." };
  }

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });
  if (!attendanceSession) {
    return { success: false, error: "Sesi presensi tidak ditemukan." };
  }

  const now = new Date();
  if (now < attendanceSession.startTime || now > attendanceSession.endTime) {
    return { success: false, error: "Sesi presensi belum aktif atau sudah berakhir." };
  }

  const nonceValid = await consumeCheckinNonce(user.id, sessionId, nonce);
  if (!nonceValid) {
    return { success: false, error: "Token check-in tidak valid atau kedaluwarsa." };
  }

  const dist = haversineDistanceMeters(
    latitude,
    longitude,
    attendanceSession.latitude,
    attendanceSession.longitude
  );

  if (dist > attendanceSession.radius) {
    return { success: false, error: `Di luar area presensi (${Math.round(dist)}m).` };
  }

  try {
    await prisma.attendanceRecord.create({
      data: { userId: user.id, sessionId: attendanceSession.id, status: "HADIR" },
    });
  } catch {
    return { success: false, error: "Sudah presensi untuk sesi ini." };
  }

  return { success: true, distance: Math.round(dist) };
}

export type BulkUpdateResult = {
  success: boolean;
  error?: string;
  updated?: number;
  missing?: string[];
};

export async function bulkUpdateAttendance(
  sessionId: string,
  status: string,
  nims: string[]
): Promise<BulkUpdateResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  const result = await attendanceService.bulkUpdateAttendance(
    sessionId,
    status,
    nims,
    session.user.email
  );

  if (result.success) {
    return {
      success: true,
      updated: result.data?.updated ?? 0,
      missing: result.data?.missing ?? [],
    };
  }

  return { success: false, error: result.error };
}
