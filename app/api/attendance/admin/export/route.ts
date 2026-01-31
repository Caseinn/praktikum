import { NextResponse } from "next/server";
import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { unauthorized, forbidden } from "@/lib/shared/api/response";

const CSV_HEADERS = ["Nama", "NIM"];

type ExportStatus = "HADIR" | "IZIN" | "TIDAK_HADIR";

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function sanitizeCsvCell(value: string): string {
  const trimmed = value.trim();
  return /^[=+\-@]/.test(trimmed) ? `'${value}` : value;
}

function toStatusLabel(status: ExportStatus): string {
  if (status === "HADIR") return "Hadir";
  if (status === "IZIN") return "Izin";
  return "Tidak hadir";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  const [sessions, roster] = await Promise.all([
    prisma.attendanceSession.findMany({ orderBy: { startTime: "asc" } }),
    prisma.studentRoster.findMany({
      where: { isActive: true },
      orderBy: { nim: "asc" },
    }),
  ]);

  const sessionIds = sessions.map((sessionItem) => sessionItem.id);
  const rosterNims = new Set(roster.map((student) => student.nim));
  const records =
    sessionIds.length > 0
      ? await prisma.attendanceRecord.findMany({
          where: { sessionId: { in: sessionIds } },
          include: { user: true },
        })
      : [];

  const recordBySession = new Map<string, Map<string, typeof records[number]>>();
  records.forEach((recordItem) => {
    const nim = recordItem.user.nim ?? "";
    if (!nim || !rosterNims.has(nim)) return;
    const byNim = recordBySession.get(recordItem.sessionId) ?? new Map();
    byNim.set(nim, recordItem);
    recordBySession.set(recordItem.sessionId, byNim);
  });

  const now = new Date();
  const sessionTitles = sessions.map((sessionItem) => sessionItem.title);
  const headerRow = [...CSV_HEADERS, ...sessionTitles];
  const rows = roster.map((student) => {
    const row: string[] = [student.fullName ?? "-", student.nim];
    sessions.forEach((sessionItem) => {
      const sessionRecords = recordBySession.get(sessionItem.id) ?? new Map();
      const record = sessionRecords.get(student.nim);
      if (record) {
        row.push(toStatusLabel(record.status as ExportStatus));
        return;
      }
      if (now > sessionItem.endTime) {
        row.push("Tidak hadir");
        return;
      }
      row.push("");
    });
    return row;
  });

  const csvData = [headerRow, ...rows]
    .map((row) =>
      row.map((value) => escapeCsv(sanitizeCsvCell(String(value)))).join(",")
    )
    .join("\n");

  return new NextResponse(csvData, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"presensi.csv\"",
      "Cache-Control": "no-store",
    },
  });
}
