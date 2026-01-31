"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Clock, MapPin, Navigation, Info } from "lucide-react";
import { formatWIBInputValue } from "@/lib/time";
import { ensureCsrfToken } from "@/lib/csrf-client";
import { CSRF_HEADER_NAME } from "@/lib/csrf";

type FormState = {
  title: string;
  startTime: string;
  latitude: string;
  longitude: string;
  radius: string;
};

function defaultWIBDateTime(hoursFromNow = 0): string {
  const future = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  return formatWIBInputValue(future);
}

export function CreateSessionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "",
    startTime: defaultWIBDateTime(0),
    latitude: "",
    longitude: "",
    radius: "100",
  });
  const [geoError, setGeoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const getCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Browser ini tidak mendukung geolokasi.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((prev) => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
      },
      (error) => {
        let message = "Gagal mengambil lokasi.";
        if (error.code === 1) {
          message = "Izinkan akses lokasi di browser untuk menggunakan fitur ini.";
        }
        setGeoError(message);
      }
    );
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeoError(null);

    if (!form.title.trim()) {
      toast.error("Judul sesi wajib diisi.");
      return;
    }
    if (!form.startTime) {
      toast.error("Waktu mulai wajib diisi.");
      return;
    }
    if (!form.latitude || !form.longitude) {
      toast.error("Koordinat lokasi wajib diisi.");
      return;
    }
    const radiusNum = Number(form.radius);
    if (isNaN(radiusNum) || radiusNum <= 0) {
      toast.error("Radius harus berupa angka positif.");
      return;
    }

    const latitudeNum = parseFloat(form.latitude);
    const longitudeNum = parseFloat(form.longitude);
    if (isNaN(latitudeNum) || !isFinite(latitudeNum)) {
      toast.error("Latitude tidak valid.");
      return;
    }
    if (isNaN(longitudeNum) || !isFinite(longitudeNum)) {
      toast.error("Longitude tidak valid.");
      return;
    }

    setBusy(true);
    const toastId = toast.loading("Menyimpan sesi presensi...");
    try {
      const csrfToken = await ensureCsrfToken();
      if (!csrfToken) {
        toast.error("Gagal mendapatkan token keamanan.", { id: toastId });
        return;
      }
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: csrfToken ?? "",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          startTime: form.startTime,
          latitude: latitudeNum,
          longitude: longitudeNum,
          radius: radiusNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal membuat sesi.", { id: toastId });
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("session-created", "Sesi presensi berhasil dibuat!");
      }
      toast.dismiss(toastId);
      setOpen(false);
      setForm({
        title: "",
        startTime: defaultWIBDateTime(0),
        latitude: "",
        longitude: "",
        radius: "100",
      });
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.", { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-fd-primary text-fd-primary-foreground">
          <CalendarPlus className="h-4 w-4" />
          Buat Sesi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Buat Sesi Presensi</DialogTitle>
          </DialogHeader>

          <FieldGroup className="mt-4 space-y-4">
            <Field>
              <Label htmlFor="title">Judul Sesi</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Contoh: Minggu 3"
                required
              />
            </Field>

            <Field>
              <Label htmlFor="startTime">Waktu Mulai (WIB)</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                required
              />
              <p className="text-xs text-fd-muted-foreground mt-1">
                Waktu berakhir otomatis diatur 1 jam setelah ini.
              </p>
            </Field>

            <div className="rounded-xl border border-fd-border bg-fd-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Lokasi
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={busy}
                  className="border-fd-border"
                >
                  <Navigation className="h-4 w-4" />
                  Gunakan Lokasi Saya
                </Button>
              </div>

              {geoError && (
                <p className="mb-3 text-sm text-[color:var(--color-fd-error)]">{geoError}</p>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <Field>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={form.latitude}
                    onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                    placeholder="-5.3852"
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={form.longitude}
                    onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                    placeholder="105.2714"
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="radius">Radius (m)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="1"
                    max="500"
                    value={form.radius}
                    onChange={(e) => setForm((prev) => ({ ...prev, radius: e.target.value }))}
                    required
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-fd-border bg-fd-background p-3 text-sm">
              <div className="flex items-start gap-2 text-fd-foreground">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-fd-muted-foreground" />
                <span>
                  <strong>Pastikan koordinat akurat!</strong> Gunakan tombol di atas untuk ambil lokasi otomatis.
                </span>
              </div>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" type="button">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={busy} className="bg-fd-primary text-fd-primary-foreground">
              {busy ? "Menyimpan..." : "Buat Sesi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
