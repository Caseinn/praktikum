import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, UserCheck, UserX } from "lucide-react";
import StudentsTable from "@/components/dashboard/students/students-table";

export default async function AdminStudentsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard/student");

  const students = await prisma.studentRoster.findMany({
    orderBy: { nim: "asc" },
  });

  const activeCount = students.filter((s) => s.isActive).length;
  const inactiveCount = students.length - activeCount;

  return (
    <main className="relative space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-3">
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Total</p>
            <Users className="h-4 w-4 text-fd-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-foreground">{students.length}</p>
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Aktif</p>
            <UserCheck className="h-4 w-4 text-fd-success flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-success">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-fd-muted-foreground line-clamp-1">Non-Aktif</p>
            <UserX className="h-4 w-4 text-fd-error flex-shrink-0" />
          </div>
          <p className="text-2xl font-semibold text-fd-error">{inactiveCount}</p>
        </div>
      </div>

      <StudentsTable students={students} />
    </main>
  );
}
