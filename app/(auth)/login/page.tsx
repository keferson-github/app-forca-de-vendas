import { cookies } from "next/headers";
import { LoginForm } from "@/components/auth/login-form";

const REMEMBERED_EMAIL_COOKIE = "forca-vendas-remembered-email";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const rememberedEmail = cookieStore.get(REMEMBERED_EMAIL_COOKIE)?.value ?? "";

  return (
    <LoginForm
      rememberedEmail={rememberedEmail}
      rememberEmail={Boolean(rememberedEmail)}
    />
  );
}
