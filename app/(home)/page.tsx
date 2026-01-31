import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { auth } from "@/lib/core/auth";

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.email);
  const ctaHref = isAuthenticated ? "/dashboard" : "/login";
  const ctaLabel = isAuthenticated ? "Dashboard" : "Masuk";

  const buttonBase =
    "inline-flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition";

  return (
    <main className="relative flex min-h-[90vh] flex-col items-center justify-center px-6">
      <div className="mx-auto w-full max-w-2xl space-y-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center justify-center">
          <div className="rounded-full bg-fd-muted px-4 py-1.5 text-xs font-medium text-fd-muted-foreground">
            Institut Teknologi Sumatera
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-fd-foreground sm:text-6xl lg:text-7xl">
            Praktikum
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-fd-muted-foreground sm:text-xl">
            Presensi dan modul pembelajaran untuk Algoritma dan Struktur Data
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/modul"
            className={`${buttonBase} border border-fd-border text-fd-foreground hover:bg-fd-muted`}
          >
            Modul
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={ctaHref}
            className={`${buttonBase} bg-fd-primary text-fd-primary-foreground shadow-sm hover:opacity-90`}
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {ctaLabel}
          </Link>
        </div>

        {/* Subtle Info */}
        <p className="pt-8 text-xs text-fd-muted-foreground">
          Login dengan akun institusi untuk mengakses platform
        </p>
      </div>
    </main>
  );
}
