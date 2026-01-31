import { auth } from "@/lib/core/auth";
import DashboardRedirect from "@/components/dashboard/dashboard-redirect";
import { LOGIN_SUCCESS_PARAM, LOGIN_SUCCESS_VALUE } from "@/lib/toast-keys";
import { redirect } from "next/navigation";

export default async function DashboardIndex(props: PageProps<"/dashboard">) {
  const session = await auth();
  if (!session) redirect("/login");

  const resolvedSearchParams = await props.searchParams;
  const loginParam = typeof resolvedSearchParams?.[LOGIN_SUCCESS_PARAM] === "string"
    ? resolvedSearchParams[LOGIN_SUCCESS_PARAM]
    : null;
  const loginSuccess = loginParam === LOGIN_SUCCESS_VALUE;

  const role = session.user.role ?? "STUDENT";
  const targetPath = role === "ADMIN" ? "/dashboard/admin" : "/dashboard/student";

  return <DashboardRedirect targetPath={targetPath} loginSuccess={loginSuccess} />;
}

