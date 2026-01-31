import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File harus berformat CSV" }, { status: 400 });
    }

    const csvContent = await file.text();
    console.log("CSV content:", csvContent.substring(0, 200));
    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    });
    console.log("Parsed records:", records.length);

    const studentsToCreate: { nim: string; fullName: string }[] = [];

    let startIndex = 0;
    if (records.length > 0) {
      const firstRow = records[0];
      const firstRowStr = firstRow.map((r: string) => r.toLowerCase().trim()).join(",");
      if (firstRowStr.includes("nim") && firstRowStr.includes("nama")) {
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < records.length; i++) {
      const record = records[i];
      if (record.length >= 2) {
        const nim = record[0].trim();
        const fullName = record[1].trim();

        if (nim && fullName) {
          studentsToCreate.push({ nim, fullName });
        }
      }
    }

    if (studentsToCreate.length === 0) {
      return NextResponse.json({ error: "Tidak ada data valid dalam CSV" }, { status: 400 });
    }

    const created = await Promise.all(
      studentsToCreate.map((student) =>
        prisma.studentRoster.upsert({
          where: { nim: student.nim },
          update: { fullName: student.fullName, isActive: true },
          create: {
            nim: student.nim,
            fullName: student.fullName,
            isActive: true,
          },
        })
      )
    );

    return NextResponse.json({
      message: `${created.length} mahasiswa berhasil diimpor`,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Gagal memproses file CSV: ${errorMessage}` }, { status: 500 });
  }
}
