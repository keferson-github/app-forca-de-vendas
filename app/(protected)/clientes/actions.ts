"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type CustomerFormState = {
  error?: string;
};

const prospectStatuses = ["PROSPECT", "QUALIFIED", "DISQUALIFIED", "CONVERTED"] as const;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhoneDigits(value: string) {
  let digits = onlyDigits(value);

  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  return digits;
}

function allDigitsEqual(value: string) {
  return /^(\d)\1+$/.test(value);
}

function calculateVerifierDigit(baseDigits: string, weights: number[]) {
  const sum = baseDigits
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function isValidCpf(value: string) {
  if (value.length !== 11 || allDigitsEqual(value)) {
    return false;
  }

  const firstDigit = calculateVerifierDigit(value.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateVerifierDigit(
    value.slice(0, 9) + String(firstDigit),
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return value.endsWith(`${firstDigit}${secondDigit}`);
}

function isValidCnpj(value: string) {
  if (value.length !== 14 || allDigitsEqual(value)) {
    return false;
  }

  const firstDigit = calculateVerifierDigit(value.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateVerifierDigit(
    value.slice(0, 12) + String(firstDigit),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return value.endsWith(`${firstDigit}${secondDigit}`);
}

function isValidCpfCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return isValidCpf(digits);
  }

  if (digits.length === 14) {
    return isValidCnpj(digits);
  }

  return false;
}

function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(
      8,
      12
    )}-${digits.slice(12)}`;
  }

  return value.trim();
}

function formatPhone(value: string) {
  const digits = normalizePhoneDigits(value);

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return value.trim();
}

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe o nome do cliente."),
  companyName: z.string().trim().optional(),
  cnpjCpf: z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
      if (!value) {
        return;
      }

      const length = onlyDigits(value).length;
      if (length !== 11 && length !== 14) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um CPF (11 digitos) ou CNPJ (14 digitos) completo.",
        });
        return;
      }

      if (!isValidCpfCnpj(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF/CNPJ invalido.",
        });
      }
    }),
  customerCode: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }

      const length = normalizePhoneDigits(value).length;
      return length === 10 || length === 11;
    }, "Informe um telefone completo com DDD."),
  commercialAddress: z.string().trim().optional(),
  deliveryAddress: z.string().trim().optional(),
  isProspect: z.boolean(),
  prospectStatus: z.enum(prospectStatuses),
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

function parseCustomerForm(formData: FormData) {
  return customerSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    cnpjCpf: formData.get("cnpjCpf"),
    customerCode: formData.get("customerCode"),
    phone: formData.get("phone"),
    commercialAddress: formData.get("commercialAddress"),
    deliveryAddress: formData.get("deliveryAddress"),
    isProspect: formData.get("isProspect") === "on" || formData.get("isProspect") === "true",
    prospectStatus: formData.get("prospectStatus") || "PROSPECT",
  });
}

function customerPayload(data: z.infer<typeof customerSchema>) {
  const normalizedCnpjCpf = data.cnpjCpf ? formatCpfCnpj(data.cnpjCpf) : "";
  const normalizedPhone = data.phone ? formatPhone(data.phone) : "";

  return {
    name: data.name,
    companyName: nullable(data.companyName),
    cnpjCpf: nullable(normalizedCnpjCpf),
    customerCode: nullable(data.customerCode),
    phone: nullable(normalizedPhone),
    commercialAddress: nullable(data.commercialAddress),
    deliveryAddress: nullable(data.deliveryAddress),
    isProspect: data.isProspect,
    prospectStatus: data.isProspect ? data.prospectStatus : "CONVERTED",
  };
}

export async function createCustomerAction(
  _state: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const userId = await requireUserId();
  const parsed = parseCustomerForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  await prisma.customer.create({
    data: {
      userId,
      ...customerPayload(parsed.data),
    },
  });

  revalidatePath("/clientes");
  redirect(`/clientes?notice=${parsed.data.isProspect ? "prospect-created" : "customer-created"}`);
}

export async function updateCustomerAction(
  _state: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const userId = await requireUserId();
  const parsed = parseCustomerForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  if (!parsed.data.id) {
    return { error: "Cliente nao identificado." };
  }

  const updated = await prisma.customer.updateMany({
    where: {
      id: parsed.data.id,
      userId,
    },
    data: customerPayload(parsed.data),
  });

  if (updated.count === 0) {
    return { error: "Cliente nao encontrado ou sem permissao para editar." };
  }

  revalidatePath("/clientes");
  redirect("/clientes?notice=customer-updated");
}

export async function deleteCustomerAction(
  _state: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Cliente nao identificado." };
  }

  try {
    const deleted = await prisma.customer.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (deleted.count === 0) {
      return { error: "Cliente nao encontrado ou sem permissao para excluir." };
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        error:
          "Nao foi possivel excluir: este cliente possui pedidos ou registros vinculados.",
      };
    }

    throw error;
  }

  revalidatePath("/clientes");
  redirect("/clientes?notice=customer-deleted");
}
