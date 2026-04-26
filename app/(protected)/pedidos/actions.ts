"use server";

import {
  DeliveryType,
  FreightType,
  OrderOperation,
  Prisma,
  PaymentTerm,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const paymentTermValues = Object.values(PaymentTerm);
const freightTypeValues = Object.values(FreightType);
const deliveryTypeValues = Object.values(DeliveryType);
const orderOperationValues = Object.values(OrderOperation);

export type OrderFormValues = {
  id: string;
  customerId: string;
  carrierId: string;
  operation: OrderOperation;
  paymentTerm: PaymentTerm;
  receivingCompany: string;
  freightType: FreightType;
  deliveryType: DeliveryType;
  notes: string;
  customerOrderNumber: string;
};

export type OrderFormState = {
  error?: string;
  values?: OrderFormValues;
};

const orderSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().trim().min(1, "Selecione o cliente do pedido."),
  carrierId: z.string().trim().optional(),
  operation: z.enum(orderOperationValues),
  paymentTerm: z.enum(paymentTermValues, {
    message: "Selecione a condição de pagamento.",
  }),
  receivingCompany: z.string().trim().optional(),
  freightType: z.enum(freightTypeValues),
  deliveryType: z.enum(deliveryTypeValues),
  notes: z.string().trim().optional(),
  customerOrderNumber: z.string().trim().optional(),
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

function getTextValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function getEnumValue<TValue extends string>(
  value: string,
  values: readonly TValue[],
  fallback: TValue,
) {
  if (values.includes(value as TValue)) {
    return value as TValue;
  }

  return fallback;
}

function getOrderFormValues(formData: FormData): OrderFormValues {
  return {
    id: getTextValue(formData, "id"),
    customerId: getTextValue(formData, "customerId"),
    carrierId: getTextValue(formData, "carrierId"),
    operation: getEnumValue(getTextValue(formData, "operation"), orderOperationValues, "VENDA"),
    paymentTerm: getEnumValue(getTextValue(formData, "paymentTerm"), paymentTermValues, "DAYS_28"),
    receivingCompany: getTextValue(formData, "receivingCompany"),
    freightType: getEnumValue(getTextValue(formData, "freightType"), freightTypeValues, "CIF"),
    deliveryType: getEnumValue(getTextValue(formData, "deliveryType"), deliveryTypeValues, "ENTREGA"),
    notes: getTextValue(formData, "notes"),
    customerOrderNumber: getTextValue(formData, "customerOrderNumber"),
  };
}

function parseOrderForm(formData: FormData) {
  const values = getOrderFormValues(formData);

  const parsed = orderSchema.safeParse({
    id: values.id || undefined,
    customerId: values.customerId,
    carrierId: values.carrierId,
    operation: values.operation,
    paymentTerm: values.paymentTerm,
    receivingCompany: values.receivingCompany,
    freightType: values.freightType,
    deliveryType: values.deliveryType,
    notes: values.notes,
    customerOrderNumber: values.customerOrderNumber,
  });

  return { values, parsed };
}

function orderPayload(data: z.infer<typeof orderSchema>) {
  return {
    customerId: data.customerId,
    carrierId: nullable(data.carrierId),
    operation: data.operation,
    paymentTerm: data.paymentTerm,
    receivingCompany: nullable(data.receivingCompany),
    freightType: data.freightType,
    deliveryType: data.deliveryType,
    notes: nullable(data.notes),
    customerOrderNumber: nullable(data.customerOrderNumber),
  };
}

async function validateRelations(userId: string, customerId: string, carrierId?: string) {
  const [customer, carrier] = await Promise.all([
    prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
      select: { id: true },
    }),
    carrierId
      ? prisma.carrier.findFirst({
          where: {
            id: carrierId,
            userId,
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (!customer) {
    return "Cliente nao encontrado ou sem permissao para uso neste pedido.";
  }

  if (carrierId && !carrier) {
    return "Transportadora nao encontrada ou sem permissao para uso neste pedido.";
  }

  return null;
}

async function getNextOrderNumber(transaction: Prisma.TransactionClient) {
  const lastOrder = await transaction.order.findFirst({
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  return (lastOrder?.orderNumber ?? 0) + 1;
}

async function createOrderWithUniqueNumber(
  userId: string,
  data: ReturnType<typeof orderPayload>,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await prisma.$transaction(async (transaction) => {
        const orderNumber = await getNextOrderNumber(transaction);

        await transaction.order.create({
          data: {
            userId,
            orderNumber,
            ...data,
          },
        });
      });

      return;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === "P2002"
        && attempt < 2
      ) {
        continue;
      }

      throw error;
    }
  }
}

export async function createOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const userId = await requireUserId();
  const { values, parsed } = parseOrderForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos.",
      values,
    };
  }

  const relationError = await validateRelations(
    userId,
    parsed.data.customerId,
    parsed.data.carrierId || undefined,
  );

  if (relationError) {
    return { error: relationError, values };
  }

  await createOrderWithUniqueNumber(userId, orderPayload(parsed.data));

  revalidatePath("/pedidos");
  redirect("/pedidos?notice=order-created");
}

export async function updateOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const userId = await requireUserId();
  const { values, parsed } = parseOrderForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos.",
      values,
    };
  }

  if (!parsed.data.id) {
    return { error: "Pedido nao identificado.", values };
  }

  const relationError = await validateRelations(
    userId,
    parsed.data.customerId,
    parsed.data.carrierId || undefined,
  );

  if (relationError) {
    return { error: relationError, values };
  }

  const updated = await prisma.order.updateMany({
    where: {
      id: parsed.data.id,
      userId,
    },
    data: orderPayload(parsed.data),
  });

  if (updated.count === 0) {
    return { error: "Pedido nao encontrado ou sem permissao para editar.", values };
  }

  revalidatePath("/pedidos");
  redirect("/pedidos?notice=order-updated");
}
