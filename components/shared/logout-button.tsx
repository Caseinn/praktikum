// components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    toast.success("Logout berhasil.");
    try {
      await signOut({ redirect: false, callbackUrl: "/" });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch {
      toast.error("Gagal logout.");
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-2 rounded-md bg-fd-primary px-4 py-2 text-sm font-semibold text-fd-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      aria-label="Logout"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
