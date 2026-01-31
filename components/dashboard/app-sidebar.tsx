"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  History,
  Calendar,
  Users,
  Download,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/shared/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Kelola Sesi", url: "/dashboard/admin/attendance", icon: Calendar },
  { title: "Kelola Mahasiswa", url: "/dashboard/admin/students", icon: Users },
  { title: "Export", url: "/dashboard/admin/export", icon: Download },
];

const studentNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/student", icon: LayoutDashboard },
  { title: "Presensi", url: "/dashboard/student/attendance", icon: CalendarCheck },
  { title: "Riwayat", url: "/dashboard/student/history", icon: History },
];

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    nim?: string | null;
    role?: "ADMIN" | "STUDENT";
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = user?.role === "ADMIN" ? adminNavItems : studentNavItems;

  const isActive = (url: string) => {
    // Dashboard is only active on exact match
    if (url === "/dashboard/admin" || url === "/dashboard/student") {
      return pathname === url;
    }
    // Other items are active when pathname starts with their URL
    return pathname.startsWith(url);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link
          href={user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/student"}
          className="flex items-center gap-2 px-2 py-1.5"
        >
          <span className="text-base font-semibold text-fd-foreground">
            Praktikum
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "transition-colors",
                        active
                          ? "bg-fd-accent text-fd-accent-foreground"
                          : "text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground"
                      )}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-fd-border bg-fd-muted/30">
          <div className="flex items-center gap-3 px-2 py-3">
            {user.image ? (
              <div className="relative h-9 w-9 overflow-hidden rounded-full">
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground text-sm font-medium">
                {getInitials(user.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-fd-foreground">
                {user.name || "User"}
              </p>
              <div className="flex items-center gap-1.5">
                {user.nim && (
                  <span className="truncate text-xs text-fd-muted-foreground">
                    {user.nim}
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider text-fd-muted-foreground">
                  • {user.role}
                </span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}

function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const { signOut } = await import("next-auth/react");
      await signOut({ redirect: false, callbackUrl: "/" });
      window.location.href = "/";
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex h-8 w-8 items-center justify-center rounded-md text-fd-muted-foreground transition hover:bg-fd-background hover:text-fd-foreground disabled:opacity-50"
      title="Logout"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
