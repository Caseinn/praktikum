import { auth } from "@/lib/core/auth";
import { studentService } from "@/lib/features/students/service";
import { parse } from "csv-parse/sync";
import { created, error, unauthorized, forbidden, badRequest } from "@/lib/shared/api/response";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return badRequest("File tidak ditemukan.");
    }

    if (!file.name.endsWith(".csv")) {
      return badRequest("File harus berformat CSV.");
    }

    const csvContent = await file.text();
    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    });

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
      return badRequest("Tidak ada data valid dalam CSV.");
    }

    const result = await studentService.importFromCsv(studentsToCreate);

    if (result.success) {
      return created({ count: result.data?.count }, `${result.data?.count} mahasiswa berhasil diimpor.`);
    }

    return error(result.error!, 400, result.code);
  } catch (err) {
    console.error("CSV import error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return error(`Gagal memproses file CSV: ${errorMessage}`, 500);
  }
}
