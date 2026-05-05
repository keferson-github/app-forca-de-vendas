"use server";

import {
  DeliveryType,
  FreightType,
  OrderOperation,
  OrderStatus,
  Prisma,
  PaymentTerm,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { billConfirmedOrderInBling, syncConfirmedOrdersToBling } from "@/lib/bling-sync";
import { buildNoticeUrl } from "@/lib/notice";
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

export type OrderItemFormValues = {
  orderId: string;
  itemId: string;
  productId: string;
  quantity: string;
  discount: string;
  unitPrice: string;
};

export type OrderItemFormState = {
  error?: string;
  values?: OrderItemFormValues;
};

export type OrderStatusFormState = {
  error?: string;
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

const orderItemSchema = z.object({
  orderId: z.string().trim().min(1, "Pedido não identificado."),
  itemId: z.string().trim().optional(),
  productId: z.string().trim().min(1, "Selecione um produto para adicionar."),
  quantity: z
    .string()
    .trim()
    .min(1, "Informe a quantidade.")
    .refine((value) => {
      const parsed = Number(value.replace(",", "."));
      return Number.isInteger(parsed) && parsed > 0;
    }, "A quantidade deve ser um número inteiro maior que zero."),
  discount: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }

      const normalized = value.replace("%", "").replace(",", ".").trim();
      const parsed = Number(normalized);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;
    }, "Desconto inválido. Use um valor entre 0 e 100."),
  unitPrice: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }

      const normalized = value.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) && parsed > 0;
    }, "Preço unitário inválido."),
});

function nullable(value?: string) {
  return value ? value : null;
}

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  return session.user.id;
}

function getTextValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function parseDecimalInput(value: string) {
  const normalized = value
    .trim()
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parseDiscountValue(value?: string) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace("%", "").replace(",", ".").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), 100);
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

function getOrderItemFormValues(formData: FormData): OrderItemFormValues {
  return {
    orderId: getTextValue(formData, "orderId"),
    itemId: getTextValue(formData, "itemId"),
    productId: getTextValue(formData, "productId"),
    quantity: getTextValue(formData, "quantity"),
    discount: getTextValue(formData, "discount"),
    unitPrice: getTextValue(formData, "unitPrice"),
  };
}

function parseOrderItemForm(formData: FormData) {
  const values = getOrderItemFormValues(formData);

  const parsed = orderItemSchema.safeParse({
    orderId: values.orderId,
    itemId: values.itemId || undefined,
    productId: values.productId,
    quantity: values.quantity,
    discount: values.discount || undefined,
    unitPrice: values.unitPrice || undefined,
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
    return "Cliente não encontrado ou sem permissão para uso neste pedido.";
  }

  if (carrierId && !carrier) {
    return "Transportadora não encontrada ou sem permissão para uso neste pedido.";
  }

  return null;
}

async function getOrderForUser(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });
}

async function recalculateOrderTotal(
  transaction: Prisma.TransactionClient,
  orderId: string,
) {
  const aggregate = await transaction.orderItem.aggregate({
    where: { orderId },
    _sum: { totalPrice: true },
  });

  await transaction.order.update({
    where: { id: orderId },
    data: {
      total: aggregate._sum.totalPrice ?? new Prisma.Decimal(0),
    },
  });
}

async function syncOrderIfConfirmed(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      status: true,
    },
  });

  if (!order || order.status !== ("CONFIRMED" satisfies OrderStatus)) {
    return;
  }

  try {
    await syncConfirmedOrdersToBling(userId, {
      orderId,
      limit: 1,
    });
  } catch (error) {
    console.error("Falha ao sincronizar pedido confirmado com o Bling", error);
  }
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
      const createdOrderId = await prisma.$transaction(async (transaction) => {
        const orderNumber = await getNextOrderNumber(transaction);

        const createdOrder = await transaction.order.create({
          data: {
            userId,
            orderNumber,
            status: "DRAFT",
            ...data,
          },
        });

        return createdOrder.id;
      });
      return createdOrderId;
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

  throw new Error("Nao foi possivel gerar numero unico para o pedido.");
}

export async function createOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const userId = await requireUserId();
  const { values, parsed } = parseOrderForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
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

  const createdOrderId = await createOrderWithUniqueNumber(userId, orderPayload(parsed.data));

  revalidatePath("/pedidos");
  redirect(`${buildNoticeUrl("/pedidos", "order-created")}&openOrderId=${encodeURIComponent(createdOrderId)}`);
}

export async function updateOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const userId = await requireUserId();
  const { values, parsed } = parseOrderForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      values,
    };
  }

  if (!parsed.data.id) {
    return { error: "Pedido não identificado.", values };
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
    return { error: "Pedido não encontrado ou sem permissão para editar.", values };
  }

  await syncOrderIfConfirmed(userId, parsed.data.id);

  revalidatePath("/pedidos");
  redirect(buildNoticeUrl("/pedidos", "order-updated"));
}

export async function deleteOrderAction(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Pedido não identificado." };
  }

  try {
    const deleted = await prisma.order.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (deleted.count === 0) {
      return { error: "Pedido não encontrado ou sem permissão para excluir." };
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2003"
    ) {
      return {
        error: "Não foi possível excluir: este pedido possui registros vinculados.",
      };
    }

    console.error("Erro inesperado ao excluir pedido.", error);
    return { error: "Não foi possível excluir o pedido no momento. Tente novamente." };
  }

  revalidatePath("/pedidos");
  redirect(buildNoticeUrl("/pedidos", "order-deleted"));
}

export async function addOrderItemAction(
  _state: OrderItemFormState,
  formData: FormData,
): Promise<OrderItemFormState> {
  const userId = await requireUserId();
  const { values, parsed } = parseOrderItemForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      values,
    };
  }

  const quantity = Number(parsed.data.quantity.replace(",", "."));
  const discount = parseDiscountValue(parsed.data.discount);
  const unitPriceValue = parsed.data.unitPrice ? parseDecimalInput(parsed.data.unitPrice) : null;

  if (unitPriceValue !== null && unitPriceValue <= 0) {
    return { error: "Preço unitário inválido.", values };
  }

  const [order, product] = await Promise.all([
    getOrderForUser(userId, parsed.data.orderId),
    prisma.product.findFirst({
      where: {
        id: parsed.data.productId,
        userId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        stockQuantity: true,
      },
    }),
  ]);

  if (!order) {
    return { error: "Pedido não encontrado ou sem permissão para edição.", values };
  }

  if (order.status !== ("DRAFT" satisfies OrderStatus)) {
    return { error: "Somente pedidos em rascunho permitem inclusão de itens.", values };
  }

  if (!product) {
    return { error: "Produto não encontrado para o item.", values };
  }

  const existingQuantityAggregate = await prisma.orderItem.aggregate({
    where: {
      orderId: order.id,
      productId: product.id,
    },
    _sum: {
      quantity: true,
    },
  });

  const totalQuantityInOrder = Number(existingQuantityAggregate._sum.quantity ?? 0);
  const nextTotalQuantityInOrder = totalQuantityInOrder + quantity;

  if (new Prisma.Decimal(nextTotalQuantityInOrder).greaterThan(product.stockQuantity)) {
    return {
      error: `Estoque insuficiente para ${product.code} - ${product.name}.`,
      values,
    };
  }

  const unitPriceDecimal = new Prisma.Decimal(
    (unitPriceValue ?? Number(product.price)).toFixed(2),
  );
  const discountDecimal = new Prisma.Decimal(discount.toFixed(2));
  const gross = unitPriceDecimal.mul(quantity);
  const discountAmount = gross.mul(discountDecimal).div(100);
  const totalPrice = gross.sub(discountAmount);

  await prisma.$transaction(async (transaction) => {
    const existingItem = await transaction.orderItem.findFirst({
      where: {
        orderId: order.id,
        productId: product.id,
        operation: "VENDA",
        unitPrice: unitPriceDecimal,
        discount: discountDecimal,
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + quantity;
      const updatedGross = unitPriceDecimal.mul(updatedQuantity);
      const updatedDiscountAmount = updatedGross.mul(discountDecimal).div(100);
      const updatedTotalPrice = updatedGross.sub(updatedDiscountAmount);

      await transaction.orderItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: updatedQuantity,
          totalPrice: updatedTotalPrice,
        },
      });
    } else {
      await transaction.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          projectNameCode: `${product.code} - ${product.name}`,
          quantity,
          discount: discountDecimal,
          unitPrice: unitPriceDecimal,
          totalPrice,
          operation: "VENDA",
        },
      });
    }

    await recalculateOrderTotal(transaction, order.id);
  });

  revalidatePath("/pedidos");
  redirect(`${buildNoticeUrl("/pedidos", "order-item-added")}&openItemsOrderId=${encodeURIComponent(order.id)}`);
}

export async function updateOrderItemAction(
  _state: OrderItemFormState,
  formData: FormData,
): Promise<OrderItemFormState> {
  const userId = await requireUserId();
  const { values, parsed } = parseOrderItemForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      values,
    };
  }

  if (!parsed.data.itemId) {
    return { error: "Item não identificado.", values };
  }

  const quantity = Number(parsed.data.quantity.replace(",", "."));
  const discount = parseDiscountValue(parsed.data.discount);
  const unitPriceValue = parsed.data.unitPrice ? parseDecimalInput(parsed.data.unitPrice) : null;

  if (unitPriceValue !== null && unitPriceValue <= 0) {
    return { error: "Preço unitário inválido.", values };
  }

  const order = await getOrderForUser(userId, parsed.data.orderId);

  if (!order) {
    return { error: "Pedido não encontrado ou sem permissão para edição.", values };
  }

  if (order.status !== ("DRAFT" satisfies OrderStatus)) {
    return { error: "Somente pedidos em rascunho permitem editar itens.", values };
  }

  const existingItem = await prisma.orderItem.findFirst({
    where: {
      id: parsed.data.itemId,
      orderId: parsed.data.orderId,
      order: {
        userId,
      },
    },
    select: {
      id: true,
      productId: true,
      product: {
        select: {
          id: true,
          code: true,
          name: true,
          price: true,
          stockQuantity: true,
        },
      },
    },
  });

  if (!existingItem) {
    return { error: "Item do pedido não encontrado.", values };
  }

  if (!existingItem.productId || !existingItem.product) {
    return { error: "Item sem produto vinculado não pode ser editado por este fluxo.", values };
  }

  if (new Prisma.Decimal(quantity).greaterThan(existingItem.product.stockQuantity)) {
    return {
      error: `Estoque insuficiente para ${existingItem.product.code} - ${existingItem.product.name}.`,
      values,
    };
  }

  const unitPriceDecimal = new Prisma.Decimal(
    (unitPriceValue ?? Number(existingItem.product.price)).toFixed(2),
  );
  const discountDecimal = new Prisma.Decimal(discount.toFixed(2));
  const gross = unitPriceDecimal.mul(quantity);
  const discountAmount = gross.mul(discountDecimal).div(100);
  const totalPrice = gross.sub(discountAmount);

  await prisma.$transaction(async (transaction) => {
    await transaction.orderItem.update({
      where: {
        id: existingItem.id,
      },
      data: {
        quantity,
        discount: discountDecimal,
        unitPrice: unitPriceDecimal,
        totalPrice,
      },
    });

    await recalculateOrderTotal(transaction, order.id);
  });

  revalidatePath("/pedidos");
  redirect(buildNoticeUrl("/pedidos", "order-item-updated"));
}

export async function deleteOrderItemAction(
  _state: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  const userId = await requireUserId();
  const orderId = String(formData.get("orderId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");

  if (!orderId || !itemId) {
    return { error: "Item não identificado para remoção." };
  }

  const order = await getOrderForUser(userId, orderId);

  if (!order) {
    return { error: "Pedido não encontrado ou sem permissão para edição." };
  }

  if (order.status !== ("DRAFT" satisfies OrderStatus)) {
    return { error: "Somente pedidos em rascunho permitem remover itens." };
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.orderItem.deleteMany({
      where: {
        id: itemId,
        orderId,
      },
    });

    await recalculateOrderTotal(transaction, orderId);
  });

  revalidatePath("/pedidos");
  redirect(buildNoticeUrl("/pedidos", "order-item-deleted"));
}

export async function refreshOrderItemsAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const orderId = String(formData.get("orderId") ?? "");

  if (orderId) {
    const order = await getOrderForUser(userId, orderId);

    if (!order) {
      revalidatePath("/pedidos");
      redirect(buildNoticeUrl("/pedidos", "order-updated"));
    }
  }

  revalidatePath("/pedidos");
  redirect(buildNoticeUrl("/pedidos", "order-item-updated"));
}

export async function confirmOrderAction(
  _state: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  const userId = await requireUserId();
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    return { error: "Pedido não identificado para confirmação." };
  }

  const orderSnapshot = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      status: true,
      items: {
        select: {
          id: true,
          quantity: true,
          productId: true,
          product: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!orderSnapshot) {
    return { error: "Pedido não encontrado ou sem permissão para confirmar." };
  }

  if (orderSnapshot.status === ("CONFIRMED" satisfies OrderStatus)) {
    return { error: "Este pedido já está confirmado." };
  }

  if (orderSnapshot.status === ("CANCELLED" satisfies OrderStatus)) {
    return { error: "Pedidos cancelados não podem ser confirmados." };
  }

  if (orderSnapshot.items.length === 0) {
    return { error: "Adicione ao menos um item antes de confirmar o pedido." };
  }

  const itemsWithoutProduct = orderSnapshot.items.filter((item) => !item.productId);
  if (itemsWithoutProduct.length > 0) {
    return { error: "Há itens sem produto vinculado. Ajuste os itens antes da confirmação." };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      for (const item of orderSnapshot.items) {
        if (!item.productId || !item.product) {
          throw new Error("Há itens sem produto vinculado.");
        }

        const updated = await transaction.product.updateMany({
          where: {
            id: item.productId,
            userId,
            stockQuantity: {
              gte: new Prisma.Decimal(item.quantity),
            },
          },
          data: {
            stockQuantity: {
              decrement: new Prisma.Decimal(item.quantity),
            },
          },
        });

        if (updated.count === 0) {
          throw new Error(`Estoque insuficiente para ${item.product.code} - ${item.product.name}.`);
        }
      }

      await recalculateOrderTotal(transaction, orderId);

      await transaction.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: "CONFIRMED",
          approvedAt: new Date(),
        },
      });
    });
  } catch (error) {
    return {
      error: error instanceof Error
        ? error.message
        : "Não foi possível confirmar o pedido no momento.",
    };
  }

  await syncOrderIfConfirmed(userId, orderId);

  revalidatePath("/pedidos");
  redirect(buildNoticeUrl("/pedidos", "order-confirmed"));
}

export async function billOrderAction(
  _state: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  const userId = await requireUserId();
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    return { error: "Pedido não identificado para faturamento." };
  }

  const result = await billConfirmedOrderInBling(userId, orderId, {
    maxAttempts: 2,
  });

  if (!result.billed) {
    return {
      error: result.reason ?? "Não foi possível faturar o pedido no Bling.",
    };
  }

  revalidatePath("/pedidos");
  redirect(buildNoticeUrl("/pedidos", "order-billed"));
}
