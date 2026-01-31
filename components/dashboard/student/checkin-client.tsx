"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ensureCsrfToken } from "@/lib/csrf-client";
import { CSRF_HEADER_NAME } from "@/lib/core/csrf";

type CheckinClientProps = {
  sessionId: string;
  isActive: boolean;
  alreadyCheckedIn: boolean;
};

function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject("Geolokasi tidak didukung di perangkat ini.");

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export default function CheckinClient({
  sessionId,
  isActive,
  alreadyCheckedIn,
}: CheckinClientProps) {
  const [msg, setMsg] = useState<string>("");
  const [checkedIn, setCheckedIn] = useState(alreadyCheckedIn);
  const router = useRouter();

  const handleCheckIn = async () => {
    if (!isActive) {
      toast.error("Sesi belum aktif atau sudah berakhir.");
      return;
    }
    if (checkedIn) {
      toast.info("Anda sudah presensi untuk sesi ini.");
      return;
    }

    const toastId = toast.loading("Memproses presensi...");
    setMsg("Mengambil lokasi...");
    try {
      const loc = await getCurrentLocation();
      setMsg("Mengirim presensi...");

      const nonceRes = await fetch(
        `/api/attendance/student/nonce?sessionId=${encodeURIComponent(sessionId)}`
      );
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok || !nonceData?.nonce) {
        setMsg("");
        toast.error(nonceData?.error ?? "Gagal menyiapkan presensi.", { id: toastId });
        return;
      }

      const csrfToken = await ensureCsrfToken();
      if (!csrfToken) {
        setMsg("");
        toast.error("Gagal mendapatkan token keamanan.", { id: toastId });
        return;
      }
      const res = await fetch("/api/attendance/student/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: csrfToken ?? "",
        },
        body: JSON.stringify({ sessionId, nonce: nonceData.nonce, ...loc }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg("");
        toast.error(data.error ?? "Gagal presensi", { id: toastId });
        return;
      }

      setMsg("");
      const distanceNote =
        typeof data.distance === "number" ? ` Jarak: ${data.distance}m` : "";
      toast.success(`Presensi berhasil.${distanceNote}`, { id: toastId });
      setCheckedIn(true);
      router.refresh();
    } catch (err: unknown) {
      setMsg("");
      const message = err instanceof Error ? err.message : "Gagal mengambil lokasi";
      toast.error(message, { id: toastId });
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleCheckIn}
        disabled={!isActive || checkedIn}
        className="w-full rounded-md bg-fd-primary px-4 py-2.5 text-sm font-semibold text-fd-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Hadir (Geofence)
      </button>
      {msg && <p className="text-sm text-fd-muted-foreground">{msg}</p>}
    </div>
  );
}
