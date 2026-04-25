"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export type RegisterState = {
  error?: string;
};

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres."),
    email: z.string().trim().toLowerCase().email("Informe um e-mail valido."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[a-zA-Z]/, "A senha deve ter pelo menos uma letra.")
      .regex(/[0-9]/, "A senha deve ter pelo menos um numero."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export async function registerAction(
  _state: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const validated = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, email, password } = validated.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "Ja existe um cadastro com esse e-mail." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });

  return {};
}
