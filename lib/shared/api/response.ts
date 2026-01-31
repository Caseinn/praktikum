import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export function ok<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    ...(message && { message }),
    data,
  });
}

export function created<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message: message ?? "Berhasil dibuat",
      data,
    },
    { status: 201 }
  );
}

export function updated<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message: message ?? "Berhasil diperbarui",
    data,
  });
}

export function deleted(message?: string): NextResponse<ApiResponse<null>> {
  return NextResponse.json({
    success: true,
    message: message ?? "Berhasil dihapus",
  });
}

export function error(
  message: string,
  status = 400,
  code?: string
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    { status }
  );
}

export function notFound(message = "Data tidak ditemukan"): NextResponse<ApiResponse<null>> {
  return error(message, 404, "NOT_FOUND");
}

export function unauthorized(message = "Tidak terautentikasi."): NextResponse<ApiResponse<null>> {
  return error(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Akses ditolak."): NextResponse<ApiResponse<null>> {
  return error(message, 403, "FORBIDDEN");
}

export function badRequest(message = "Permintaan tidak valid"): NextResponse<ApiResponse<null>> {
  return error(message, 400, "BAD_REQUEST");
}

export function serverError(message = "Terjadi kesalahan server"): NextResponse<ApiResponse<null>> {
  return error(message, 500, "SERVER_ERROR");
}
