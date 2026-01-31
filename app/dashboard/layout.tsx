import { auth } from "@/lib/core/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import ToasterProvider from "@/components/shared/toaster-provider";
import DashboardToast from "@/components/shared/dashboard-toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          nim: session.user.nim,
          role: session.user.role,
        }}
      />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1">
          <ToasterProvider />
          <DashboardToast />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
