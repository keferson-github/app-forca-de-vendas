import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f9fc_0%,#f5f7fb_100%)] lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <AppSidebar />
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
