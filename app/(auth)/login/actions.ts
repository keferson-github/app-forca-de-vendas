"use server";

import { AuthError, signIn } from "@/auth";
import { cookies } from "next/headers";
import { z } from "zod";

export type LoginState = {
  error?: string;
};

const REMEMBERED_EMAIL_COOKIE = "forca-vendas-remembered-email";
const REMEMBERED_EMAIL_MAX_AGE = 60 * 60 * 24 * 30;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail valido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  rememberMe: z.boolean(),
});

export async function loginAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const cookieStore = await cookies();
  if (validated.data.rememberMe) {
    cookieStore.set(REMEMBERED_EMAIL_COOKIE, validated.data.email, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: REMEMBERED_EMAIL_MAX_AGE,
      path: "/login",
    });
  } else {
    cookieStore.delete(REMEMBERED_EMAIL_COOKIE);
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}
