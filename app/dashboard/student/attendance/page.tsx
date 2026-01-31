import { auth } from "@/lib/core/auth";
import { prisma } from "@/lib/core/prisma";
import { redirect } from "next/navigation";
import AttendanceList from "@/components/dashboard/attendance-list";

export default async function StudentAttendancePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/dashboard/admin/attendance");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  return (
    <AttendanceList
      role="STUDENT"
      userId={user.id}
      basePath="/dashboard/student/attendance"
    />
  );
}

