import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return <AuthShell>{children}</AuthShell>;
}
