"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardHeaderProps {
  items?: BreadcrumbItem[];
}

export function DashboardHeader({ items = [] }: DashboardHeaderProps) {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = [
      { label: "Dashboard", href: "/dashboard" },
    ];

    // Check for exact path segments
    const segments = pathname.split("/").filter(Boolean);
    const isAdmin = segments.includes("admin");
    const isStudent = segments.includes("student");

    if (isAdmin) {
      crumbs.push({ label: "Admin", href: "/dashboard/admin" });

      // Check for specific admin routes
      if (segments.includes("attendance")) {
        crumbs.push({ label: "Kelola Sesi", href: "/dashboard/admin/attendance" });

        // Check if new session
        if (segments.includes("new")) {
          crumbs.push({ label: "Buat Sesi Baru" });
        }
        // Check if session detail
        else if (segments.length >= 4 && !["attendance", "new"].includes(segments[segments.length - 1])) {
          crumbs.push({ label: "Detail Sesi" });
        }
      }

      if (segments.includes("students")) {
        crumbs.push({ label: "Kelola Mahasiswa" });
      }

      if (segments.includes("export")) {
        crumbs.push({ label: "Export Data" });
      }
    } else if (isStudent) {
      crumbs.push({ label: "Mahasiswa", href: "/dashboard/student" });

      if (segments.includes("attendance")) {
        crumbs.push({ label: "Presensi" });

        // Check if attendance detail
        if (segments.length >= 4 && !["attendance"].includes(segments[segments.length - 1])) {
          crumbs.push({ label: "Check-in" });
        }
      }

      if (segments.includes("history")) {
        crumbs.push({ label: "Riwayat" });
      }
    }

    return crumbs;
  };

  const breadcrumbs = items.length > 0 ? items : getBreadcrumbs();

  return (
    <header className="flex items-center gap-2 border-b border-fd-border bg-fd-background/95 backdrop-blur supports-[backdrop-filter]:bg-fd-background/60 px-4 py-3">
      <SidebarTrigger />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage className="text-sm font-medium text-fd-foreground">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="text-sm text-fd-muted-foreground hover:text-fd-foreground"
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator />
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
