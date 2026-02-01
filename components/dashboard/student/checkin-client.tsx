"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { getCheckinNonce, checkIn } from "@/lib/actions/admin";

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

  const checkInMutation = useMutation({
    mutationFn: ({ nonce, latitude, longitude }: { nonce: string; latitude: number; longitude: number }) =>
      checkIn(sessionId, nonce, latitude, longitude),
    onSuccess: (result) => {
      if (result.success) {
        const distanceNote =
          typeof result.distance === "number" ? ` Jarak: ${result.distance}m` : "";
        toast.success(`Presensi berhasil.${distanceNote}`);
        setCheckedIn(true);
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal presensi");
      }
      setMsg("");
    },
    onError: (error) => {
      setMsg("");
      toast.error(error instanceof Error ? error.message : "Gagal presensi");
    },
  });

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

      const nonce = await getCheckinNonce(sessionId);

      checkInMutation.mutate({
        nonce,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });

      toast.dismiss(toastId);
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
        disabled={!isActive || checkedIn || checkInMutation.isPending}
        className="w-full rounded-md bg-fd-primary px-4 py-2.5 text-sm font-semibold text-fd-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {checkInMutation.isPending ? "Memproses..." : "Hadir (Geofence)"}
      </button>
      {msg && <p className="text-sm text-fd-muted-foreground">{msg}</p>}
    </div>
  );
}
