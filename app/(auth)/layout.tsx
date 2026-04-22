import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fefefe_0%,#f2f4f8_55%,#eceff4_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
