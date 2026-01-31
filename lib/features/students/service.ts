import { prisma } from "@/lib/core/prisma";
import type { ServiceResult } from "@/lib/features/service-types";

export type StudentCreateInput = {
  nim: string;
  fullName: string;
};

export type StudentOutput = {
  id: string;
  nim: string;
  fullName: string | null;
  isActive: boolean;
};

export const studentService = {
  async addStudent(input: StudentCreateInput): Promise<ServiceResult<StudentOutput>> {
    const student = await prisma.studentRoster.upsert({
      where: { nim: input.nim.trim() },
      update: { fullName: input.fullName.trim(), isActive: true },
      create: { nim: input.nim.trim(), fullName: input.fullName.trim(), isActive: true },
    });
    return { success: true, data: student };
  },

  async deleteStudent(nim: string): Promise<ServiceResult> {
    try {
      await prisma.studentRoster.delete({ where: { nim } });
      return { success: true };
    } catch {
      return { success: false, error: "Gagal menghapus mahasiswa.", code: "DELETE_FAILED" };
    }
  },

  async importFromCsv(
    records: { nim: string; fullName: string }[]
  ): Promise<ServiceResult<{ count: number }>> {
    const studentsToCreate = records.filter((r) => r.nim && r.fullName);
    if (studentsToCreate.length === 0) {
      return { success: false, error: "Tidak ada data valid dalam CSV", code: "INVALID_CSV" };
    }

    const created = await Promise.all(
      studentsToCreate.map((s) =>
        prisma.studentRoster.upsert({
          where: { nim: s.nim },
          update: { fullName: s.fullName, isActive: true },
          create: { nim: s.nim, fullName: s.fullName, isActive: true },
        })
      )
    );

    return { success: true, data: { count: created.length } };
  },

  async getAllStudents() {
    return prisma.studentRoster.findMany({ orderBy: { nim: "asc" } });
  },

  async getStudentByNim(nim: string) {
    return prisma.studentRoster.findUnique({ where: { nim } });
  },
};
