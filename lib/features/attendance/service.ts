import { prisma } from "@/lib/core/prisma";
import { parseWIBDateTime } from "@/lib/shared/time";
import type { ServiceResult } from "@/lib/features/service-types";

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

export const attendanceService = {
  async createSession(
    input: SessionCreateInput,
    adminId: string
  ): Promise<ServiceResult<SessionOutput>> {
    const startTimeUTC = parseWIBDateTime(input.startTime);
    if (!startTimeUTC) {
      return { success: false, error: "Waktu mulai tidak valid.", code: "INVALID_TIME" };
    }

    const endTimeUTC = new Date(startTimeUTC.getTime() + 60 * 60 * 1000);

    const session = await prisma.attendanceSession.create({
      data: {
        title: input.title,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        latitude: input.latitude,
        longitude: input.longitude,
        radius: input.radius,
        createdById: adminId,
      },
    });

    console.info("[audit] attendance.session.create", {
      adminId,
      sessionId: session.id,
      title: session.title,
    });

    return { success: true, data: session };
  },

  async getSessions(role: "ADMIN" | "STUDENT") {
    const sessions = await prisma.attendanceSession.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (role !== "ADMIN") {
      return sessions.map((item) => ({
        id: item.id,
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        radius: item.radius,
      }));
    }

    return sessions;
  },

  async getSessionWithRecords(sessionId: string) {
    return prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        records: {
          include: { user: { select: { id: true, name: true, nim: true } } },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async bulkUpdateAttendance(
    sessionId: string,
    status: string,
    nims: string[],
    adminId: string
  ): Promise<ServiceResult<{ updated: number; missing: string[] }>> {
    const MAX_NIMS = 200;
    const uniqueNims = Array.from(
      new Set(nims.map((nim) => nim.trim()).filter(Boolean))
    );

    if (uniqueNims.length === 0) {
      return { success: false, error: "Daftar NIM wajib diisi.", code: "EMPTY_NIMS" };
    }
    if (uniqueNims.length > MAX_NIMS) {
      return { success: false, error: "Jumlah NIM terlalu banyak.", code: "TOO_MANY_NIMS" };
    }

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!attendanceSession) {
      return { success: false, error: "Sesi presensi tidak ditemukan.", code: "SESSION_NOT_FOUND" };
    }

    const users = await prisma.user.findMany({
      where: { nim: { in: uniqueNims } },
      select: { id: true, nim: true },
    });
    if (users.length === 0) {
      return { success: false, error: "Pengguna dengan NIM tersebut tidak ditemukan.", code: "USERS_NOT_FOUND" };
    }

    const foundNims = new Set(users.map((user) => user.nim ?? ""));
    const missing = uniqueNims.filter((nim) => !foundNims.has(nim));

    const timestamp = new Date();
    const batchSize = 20;
    for (let i = 0; i < users.length; i += batchSize) {
      const chunk = users.slice(i, i + batchSize);
      await Promise.all(
        chunk.map((user) =>
          prisma.attendanceRecord.upsert({
            where: { userId_sessionId: { userId: user.id, sessionId } },
            update: { status: status as "HADIR" | "IZIN" | "TIDAK_HADIR", attendedAt: timestamp },
            create: { userId: user.id, sessionId, status: status as "HADIR" | "IZIN" | "TIDAK_HADIR", attendedAt: timestamp },
          })
        )
      );
    }

    console.info("[audit] attendance.bulk", {
      adminId,
      sessionId,
      status,
      updated: users.length,
    });

    return { success: true, data: { updated: users.length, missing } };
  },
};
