import { auth } from "@/lib/core/auth";
import { studentService } from "@/lib/features/students/service";
import { created, deleted, error, unauthorized, forbidden, notFound } from "@/lib/shared/api/response";
import { validateBody, parseJsonBody, getQueryParam } from "@/lib/shared/api/validation";
import { studentSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  try {
    const body = await parseJsonBody(request);
    if (!body) return error("Payload tidak valid.", 400);

    const validation = validateBody(studentSchema, body);
    if (!validation.success) return validation.response;

    const { nim, fullName } = validation.data;
    const result = await studentService.addStudent({ nim, fullName });

    if (result.success) {
      return created(result.data, "Mahasiswa berhasil ditambahkan.");
    }

    return error(result.error!, 400, result.code);
  } catch {
    console.error("Add student error");
    return error("Gagal menambahkan mahasiswa.", 500);
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  try {
    const nim = getQueryParam(request, "nim");

    if (!nim) {
      return error("NIM wajib diisi.", 400);
    }

    const result = await studentService.deleteStudent(nim);

    if (result.success) {
      return deleted("Mahasiswa berhasil dihapus.");
    }

    if (result.code === "DELETE_FAILED") {
      return notFound("Mahasiswa tidak ditemukan.");
    }

    return error(result.error!, 500, result.code);
  } catch {
    console.error("Delete student error");
    return error("Gagal menghapus mahasiswa.", 500);
  }
}
