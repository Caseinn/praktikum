import { auth } from "@/lib/core/auth";
import { studentService } from "@/lib/features/students/service";
import { created, deleted, error, unauthorized, forbidden, badRequest, notFound } from "@/lib/shared/api/response";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();
  if (session.user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const { nim, fullName } = body;

    if (!nim || typeof nim !== "string") {
      return badRequest("NIM wajib diisi.");
    }

    if (!fullName || typeof fullName !== "string") {
      return badRequest("Nama wajib diisi.");
    }

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
    const { searchParams } = new URL(request.url);
    const nim = searchParams.get("nim");

    if (!nim) {
      return badRequest("NIM wajib diisi.");
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
