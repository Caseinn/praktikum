import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminExportPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard/student");

  const attendanceCount = await prisma.attendanceRecord.count();

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 sm:p-6 animate-fade-up">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-fd-border bg-fd-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fd-success/10">
              <FileSpreadsheet className="h-6 w-6 text-fd-success" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fd-foreground">Export Presensi</h1>
              <p className="text-sm text-fd-muted-foreground">
                {attendanceCount.toLocaleString()} record tersedia
              </p>
            </div>
          </div>

          <a
            href="/api/attendance/export"
            download="presensi.csv"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-fd-primary px-4 py-3 font-semibold text-fd-primary-foreground transition hover:opacity-90"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </a>

          <p className="mt-4 text-center text-xs text-fd-muted-foreground">
            File CSV dapat dibuka dengan Excel, Google Sheets, dll.
          </p>
        </div>
      </div>
    </main>
  );
}
