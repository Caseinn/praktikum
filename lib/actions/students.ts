"use server";

import { auth } from "@/lib/core/auth";
import { studentService } from "@/lib/features/students/service";
import { revalidatePath } from "next/cache";
import { parse } from "csv-parse/sync";

export type StudentResult = {
  success: boolean;
  error?: string;
  code?: string;
  data?: {
    nim: string;
    fullName: string;
    count?: number;
  };
};

export async function addStudent(nim: string, fullName: string): Promise<StudentResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };
  }

  const result = await studentService.addStudent({ nim, fullName });

  if (result.success) {
    revalidatePath("/dashboard/admin/students");
    return { success: true, data: { nim, fullName } };
  }

  return { success: false, error: result.error, code: result.code };
}

export async function deleteStudent(nim: string): Promise<StudentResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden", code: "FORBIDDEN" };
  }

  const result = await studentService.deleteStudent(nim);

  if (result.success) {
    revalidatePath("/dashboard/admin/students");
    return { success: true };
  }

  if (result.code === "DELETE_FAILED") {
    return { success: false, error: "Mahasiswa tidak ditemukan.", code: "NOT_FOUND" };
  }

  return { success: false, error: result.error, code: result.code };
}

export type ImportResult = {
  success: boolean;
  error?: string;
  count?: number;
};

export async function importStudentsFromCsv(file: File): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  if (!file.name.endsWith(".csv")) {
    return { success: false, error: "File harus berformat CSV." };
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
    return { success: false, error: "Tidak ada data valid dalam CSV." };
  }

  const result = await studentService.importFromCsv(studentsToCreate);

  if (result.success) {
    revalidatePath("/dashboard/admin/students");
    return { success: true, count: result.data?.count };
  }

  return { success: false, error: result.error };
}
