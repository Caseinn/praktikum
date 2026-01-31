import { auth } from "@/lib/core/auth";
import { redirect } from "next/navigation";
import LoginClient from "@/components/auth/login-client";

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  if (session?.user?.email) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await props.searchParams;
  const errorParam = resolvedSearchParams?.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam ?? null;

  return <LoginClient error={error} />;
}

