import { z } from "zod";

export const checkinSchema = z.object({
  sessionId: z.string().trim().min(1, "Session ID wajib diisi."),
  nonce: z.string().trim().min(1, "Nonce wajib diisi."),
  latitude: z.number().refine((val) => Number.isFinite(val), "Latitude harus berupa angka."),
  longitude: z.number().refine((val) => Number.isFinite(val), "Longitude harus berupa angka."),
});

export const sessionCreateSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi."),
  startTime: z.string().min(1, "Waktu mulai wajib diisi."),
  latitude: z.number().refine((val) => Number.isFinite(val), "Latitude harus berupa angka."),
  longitude: z.number().refine((val) => Number.isFinite(val), "Longitude harus berupa angka."),
  radius: z.number().positive("Radius harus lebih dari 0."),
});

export const bulkAttendanceSchema = z.object({
  sessionId: z.string().trim().min(1, "Session ID wajib diisi."),
  status: z.enum(["HADIR", "IZIN", "TIDAK_HADIR"]),
  nims: z.array(z.string()).min(1, "Daftar NIM wajib diisi."),
});

export type CheckinInput = z.infer<typeof checkinSchema>;
export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
