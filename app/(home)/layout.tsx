"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { RootProvider } from "fumadocs-ui/provider";
import { toast } from "sonner";
import ToasterProvider from "@/components/shared/toaster-provider";
import { baseOptions, linkItems } from "@/lib/layout.shared";

function ToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("loggedout") === "true") {
      window.history.replaceState(null, "", "/");
      toast.success("Logout berhasil.");
    }
  }, [searchParams]);

  return null;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideNavbar = pathname === "/login";

  return (
    <RootProvider>
      <ToasterProvider />
      <HomeLayout
        {...baseOptions()}
        links={hideNavbar ? [] : linkItems}
      >
        <Suspense fallback={null}>
          <ToastHandler />
        </Suspense>
        {children}
      </HomeLayout>
    </RootProvider>
  );
}
