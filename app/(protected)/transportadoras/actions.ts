"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type CarrierFormState = {
  error?: string;
};

const carrierSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe o nome da transportadora."),
  contact: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function nullable(value?: string) {
  return value ? value : null;
}

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  return session.user.id;
}

function parseCarrierForm(formData: FormData) {
  return carrierSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    name: formData.get("name"),
    contact: formData.get("contact"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });
}

function carrierPayload(data: z.infer<typeof carrierSchema>) {
  return {
    name: data.name,
    contact: nullable(data.contact),
    phone: nullable(data.phone),
    notes: nullable(data.notes),
  };
}

export async function createCarrierAction(
  _state: CarrierFormState,
  formData: FormData
): Promise<CarrierFormState> {
  const userId = await requireUserId();
  const parsed = parseCarrierForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  await prisma.carrier.create({
    data: {
      userId,
      ...carrierPayload(parsed.data),
    },
  });

  revalidatePath("/transportadoras");
  redirect("/transportadoras?notice=carrier-created");
}

export async function updateCarrierAction(
  _state: CarrierFormState,
  formData: FormData
): Promise<CarrierFormState> {
  const userId = await requireUserId();
  const parsed = parseCarrierForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  if (!parsed.data.id) {
    return { error: "Transportadora nao identificada." };
  }

  const updated = await prisma.carrier.updateMany({
    where: {
      id: parsed.data.id,
      userId,
    },
    data: carrierPayload(parsed.data),
  });

  if (updated.count === 0) {
    return { error: "Transportadora nao encontrada ou sem permissao para editar." };
  }

  revalidatePath("/transportadoras");
  redirect("/transportadoras?notice=carrier-updated");
}

export async function deleteCarrierAction(
  _state: CarrierFormState,
  formData: FormData
): Promise<CarrierFormState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Transportadora nao identificada." };
  }

  try {
    const deleted = await prisma.carrier.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (deleted.count === 0) {
      return { error: "Transportadora nao encontrada ou sem permissao para excluir." };
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        error:
          "Nao foi possivel excluir: esta transportadora possui pedidos vinculados.",
      };
    }

    throw error;
  }

  revalidatePath("/transportadoras");
  redirect("/transportadoras?notice=carrier-deleted");
}
