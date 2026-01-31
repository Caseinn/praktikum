export type AttendanceSession = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  latitude: number;
  longitude: number;
  radius: number;
  createdById: string;
};

export type AttendanceSessionBasic = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  radius: number;
};

export type AttendanceStatus = "HADIR" | "IZIN" | "TIDAK_HADIR" | "BELUM";

export type AttendanceRecord = {
  id: string;
  userId: string;
  sessionId: string;
  status: AttendanceStatus;
  attendedAt: Date | null;
};

export type AttendanceRow = {
  nim: string;
  name: string;
  status: AttendanceStatus;
  attendedAt: Date | null;
};

export type SessionFormData = {
  title: string;
  startTime: string;
  latitude: number;
  longitude: number;
  radius: number;
};
