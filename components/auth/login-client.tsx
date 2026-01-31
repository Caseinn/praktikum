"use client";

import * as React from "react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";
import ToasterProvider from "@/components/shared/toaster-provider";

type LoginClientProps = {
  error: string | null;
};

function getErrorMessage(error: string | null) {
  if (!error) return null;
  if (error === "AccessDenied") return "Akun Anda tidak diizinkan untuk login.";
  return "Terjadi kesalahan saat login. Silakan coba lagi.";
}

export default function LoginClient({ error }: LoginClientProps) {
  const errorMessage = getErrorMessage(error);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  async function handleGoogleLogin() {
    if (loading) return;

    try {
      setLoading(true);
      const result = await signIn("google", {
        callbackUrl: "/dashboard?login=success",
        redirect: false,
      });
      if (result?.error) {
        toast.error(getErrorMessage(result.error) ?? "Gagal login.");
        setLoading(false);
        return;
      }

      const target = result?.url ?? "/dashboard";
      setTimeout(() => {
        window.location.href = target;
      }, 800);
    } catch {
      toast.error("Gagal memulai login.");
      setLoading(false);
    }
  }

  return (
    <>
      <ToasterProvider />
      <main className="relative min-h-screen overflow-hidden">
        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-14 md:py-16 lg:py-20">
          <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            {/* Left: copy */}
            <section className="space-y-5">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-fd-foreground sm:text-4xl">
                  Masuk ke Dashboard
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-fd-muted-foreground">
                  Gunakan akun Google ITERA untuk mengakses dashboard.
                </p>
              </div>
            </section>

            {/* Right: card */}
            <section className="rounded-2xl border border-fd-border bg-fd-card/80 p-6 shadow-sm backdrop-blur">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-fd-foreground">
                  Login
                </h2>
                <p className="mt-2 text-sm text-fd-muted-foreground">
                  Masuk menggunakan Google ITERA.
                </p>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-fd-primary px-4 py-3 text-sm font-semibold text-fd-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-fd-primary-foreground/30 border-t-fd-primary-foreground" />
                    Mengarahkan...
                  </>
                ) : (
                  <>
                    <FaGoogle className="h-5 w-5" />
                    Lanjutkan dengan Google
                  </>
                )}
              </button>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-fd-border" />
              </div>

              <p className="text-center text-xs leading-relaxed text-fd-muted-foreground">
                Dengan melanjutkan, Anda menyetujui proses autentikasi via Google ITERA.
                Jika akun Anda belum terdaftar, hubungi admin.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
