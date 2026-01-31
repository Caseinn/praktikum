import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { nim, fullName } = body;

    if (!nim || typeof nim !== "string") {
      return NextResponse.json({ error: "NIM wajib diisi" }, { status: 400 });
    }

    if (!fullName || typeof fullName !== "string") {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }

    const student = await prisma.studentRoster.upsert({
      where: { nim: nim.trim() },
      update: { fullName: fullName.trim(), isActive: true },
      create: {
        nim: nim.trim(),
        fullName: fullName.trim(),
        isActive: true,
      },
    });

    return NextResponse.json({ message: "Mahasiswa berhasil ditambahkan", student });
  } catch (error) {
    console.error("Add student error:", error);
    return NextResponse.json({ error: "Gagal menambahkan mahasiswa" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const nim = searchParams.get("nim");

    if (!nim) {
      return NextResponse.json({ error: "NIM wajib diisi" }, { status: 400 });
    }

    await prisma.studentRoster.delete({
      where: { nim },
    });

    return NextResponse.json({ message: "Mahasiswa berhasil dihapus" });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "Gagal menghapus mahasiswa" }, { status: 500 });
  }
}
