import { auth } from "@/lib/core/auth";
import { redirect } from "next/navigation";

export default async function AttendanceRedirectPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const role = session.user.role ?? "STUDENT";
  if (role === "ADMIN") redirect("/dashboard/admin/attendance");
  redirect("/dashboard/student/attendance");
}

