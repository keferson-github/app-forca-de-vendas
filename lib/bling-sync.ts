import { Prisma, type OrderStatus } from "@prisma/client";
import { blingRequest } from "@/lib/bling";
import { prisma } from "@/lib/prisma";

type UnknownRecord = Record<string, unknown>;

type BlingApiResponse = {
  data?: unknown;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function toStringValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function toNumberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toDecimal(value: unknown, scale = 3) {
  const parsed = toNumberValue(value);
  if (parsed === null) {
    return null;
  }

  return new Prisma.Decimal(parsed.toFixed(scale));
}

function normalizeEventName(event: string) {
  return event.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function deepFindFirst(
  value: unknown,
  matcher: (record: UnknownRecord) => unknown
): unknown {
  const root = asRecord(value);
  if (!root) {
    return null;
  }

  const visited = new Set<unknown>();
  const queue: unknown[] = [root];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    const record = asRecord(current);
    if (!record) {
      continue;
    }

    const matched = matcher(record);
    if (matched !== undefined && matched !== null) {
      return matched;
    }

    for (const entry of Object.values(record)) {
      if (Array.isArray(entry)) {
        for (const child of entry) {
          queue.push(child);
        }
      } else if (entry && typeof entry === "object") {
        queue.push(entry);
      }
    }
  }

  return null;
}

function extractIdFromBlingResponse(body: unknown) {
  const found = deepFindFirst(body, (record) => record.id);
  return toStringValue(found);
}

function extractBlingProductFromBody(body: unknown) {
  const record = deepFindFirst(body, (candidate) => {
    const hasCode = candidate.codigo !== undefined || candidate.code !== undefined;
    const hasName = candidate.nome !== undefined || candidate.name !== undefined;
    if (hasCode || hasName) {
      return candidate;
    }

    return null;
  });

  const product = asRecord(record);
  if (!product) {
    return null;
  }

  return {
    blingProductId: toStringValue(product.id),
    code: toStringValue(product.codigo) ?? toStringValue(product.code),
    name: toStringValue(product.nome) ?? toStringValue(product.name),
    price:
      toNumberValue(product.preco) ??
      toNumberValue(product.valor) ??
      toNumberValue(product.precoVenda) ??
      null,
    stockQuantity:
      toNumberValue(product.saldoVirtualTotal) ??
      toNumberValue(product.saldoFisicoTotal) ??
      toNumberValue(product.quantidade) ??
      toNumberValue(product.estoque) ??
      null,
  };
}

function extractStockFromBody(body: unknown) {
  const found = deepFindFirst(body, (record) => {
    const keys = [
      "saldoVirtualTotal",
      "saldoFisicoTotal",
      "saldo",
      "quantidade",
      "estoque",
      "saldoAtual",
    ];
    for (const key of keys) {
      if (record[key] !== undefined) {
        return record[key];
      }
    }
    return null;
  });

  return toNumberValue(found);
}

function extractWebhookProductIdentifiers(payload: unknown) {
  const record = asRecord(payload);
  if (!record) {
    return { blingProductId: null, code: null };
  }

  const data = asRecord(record.data) ?? record;
  const product = asRecord(data.produto) ?? asRecord(data.product);

  const blingProductId =
    toStringValue(data.idProduto) ??
    toStringValue(data.produtoId) ??
    toStringValue(data.id) ??
    toStringValue(product?.id) ??
    null;
  const code =
    toStringValue(data.codigo) ??
    toStringValue(data.sku) ??
    toStringValue(product?.codigo) ??
    toStringValue(product?.sku) ??
    null;

  return { blingProductId, code };
}

async function getProductByIdentifiers(userId: string, identifiers: { blingProductId?: string | null; code?: string | null }) {
  const filters: Prisma.ProductWhereInput[] = [];
  if (identifiers.blingProductId) {
    filters.push({ blingProductId: identifiers.blingProductId });
  }
  if (identifiers.code) {
    filters.push({ code: identifiers.code });
  }

  if (filters.length === 0) {
    return null;
  }

  return prisma.product.findFirst({
    where: {
      userId,
      OR: filters,
    },
  });
}

function buildBlingProductPayload(product: {
  code: string;
  name: string;
  price: Prisma.Decimal;
  description: string | null;
}) {
  return {
    nome: product.name,
    codigo: product.code,
    tipo: "P",
    situacao: "A",
    formato: "S",
    preco: Number(product.price),
    descricaoCurta: product.description ?? undefined,
  };
}

async function upsertProductInBling(product: {
  id: string;
  userId: string;
  code: string;
  name: string;
  price: Prisma.Decimal;
  description: string | null;
  blingProductId: string | null;
}) {
  const payload = buildBlingProductPayload(product);
  if (product.blingProductId) {
    await blingRequest(product.userId, `/produtos/${product.blingProductId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return product.blingProductId;
  }

  const created = await blingRequest<BlingApiResponse>(product.userId, "/produtos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const blingId = extractIdFromBlingResponse(created);
  if (!blingId) {
    throw new Error("A API do Bling nao retornou o id do produto apos o cadastro.");
  }

  return blingId;
}

async function getBlingProductDetails(userId: string, blingProductId: string) {
  return blingRequest<BlingApiResponse>(userId, `/produtos/${blingProductId}`);
}

async function getBlingStockBalance(userId: string, blingProductId: string) {
  const endpoints = [
    `/estoques/saldos?produto=${blingProductId}`,
    `/estoques/saldos?idProduto=${blingProductId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await blingRequest<BlingApiResponse>(userId, endpoint);
      const quantity = extractStockFromBody(response);
      if (quantity !== null) {
        return quantity;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function applyBlingProductSnapshot(
  userId: string,
  identifiers: { blingProductId?: string | null; code?: string | null },
  snapshot: {
    blingProductId: string | null;
    code: string | null;
    name: string | null;
    price: number | null;
    stockQuantity: number | null;
  }
) {
  const product = await getProductByIdentifiers(userId, identifiers);
  if (!product) {
    return false;
  }

  const payload: Prisma.ProductUpdateInput = {
    lastBlingSyncAt: new Date(),
    lastBlingError: null,
  };

  if (snapshot.blingProductId) {
    payload.blingProductId = snapshot.blingProductId;
  }
  if (snapshot.code) {
    payload.code = snapshot.code;
  }
  if (snapshot.name) {
    payload.name = snapshot.name;
  }
  if (snapshot.price !== null) {
    payload.price = new Prisma.Decimal(snapshot.price.toFixed(2));
  }
  if (snapshot.stockQuantity !== null) {
    payload.stockQuantity = new Prisma.Decimal(snapshot.stockQuantity.toFixed(3));
  }

  await prisma.product.update({
    where: { id: product.id },
    data: payload,
  });
  return true;
}

async function syncOrderToBling(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order || order.status !== ("CONFIRMED" satisfies OrderStatus)) {
    return { synced: false, reason: "Pedido nao encontrado ou nao confirmado." };
  }

  const payload = {
    numeroLoja: String(order.orderNumber),
    data: order.createdAt.toISOString().slice(0, 10),
    contato: {
      nome: order.customer.name,
    },
    observacoes: order.notes ?? undefined,
    itens: order.items.map((item) => ({
      codigo: item.product?.code ?? item.projectNameCode,
      descricao: item.projectNameCode,
      quantidade: item.quantity,
      valor: Number(item.unitPrice),
    })),
  };

  try {
    if (order.blingOrderId) {
      await blingRequest(order.userId, `/pedidos/vendas/${order.blingOrderId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      const created = await blingRequest<BlingApiResponse>(order.userId, "/pedidos/vendas", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const blingOrderId = extractIdFromBlingResponse(created);
      if (!blingOrderId) {
        throw new Error("A API do Bling nao retornou o id do pedido.");
      }
      await prisma.order.update({
        where: { id: order.id },
        data: { blingOrderId },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        lastBlingSyncAt: new Date(),
        lastBlingError: null,
      },
    });
    return { synced: true };
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        lastBlingError: error instanceof Error ? error.message : "Falha ao sincronizar pedido.",
      },
    });
    return { synced: false, reason: error instanceof Error ? error.message : "Falha ao sincronizar pedido." };
  }
}

export async function syncProductToBlingById(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      code: true,
      name: true,
      price: true,
      description: true,
      blingProductId: true,
    },
  });

  if (!product) {
    return { synced: false, reason: "Produto nao encontrado." };
  }

  const hasConnection = await prisma.blingConnection.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!hasConnection) {
    return { synced: false, reason: "Conta nao conectada ao Bling." };
  }

  try {
    const blingProductId = await upsertProductInBling(product);
    const details = await getBlingProductDetails(userId, blingProductId).catch(() => null);
    const snapshot = details ? extractBlingProductFromBody(details) : null;
    const balance = await getBlingStockBalance(userId, blingProductId);

    await prisma.product.update({
      where: { id: product.id },
      data: {
        blingProductId,
        stockQuantity: toDecimal(balance ?? snapshot?.stockQuantity ?? 0, 3) ?? new Prisma.Decimal(0),
        lastBlingSyncAt: new Date(),
        lastBlingError: null,
      },
    });

    return { synced: true };
  } catch (error) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        lastBlingError: error instanceof Error ? error.message : "Falha ao sincronizar produto.",
      },
    });
    return { synced: false, reason: error instanceof Error ? error.message : "Falha ao sincronizar produto." };
  }
}

export async function syncProductsToBling(userId: string, options?: { productId?: string; limit?: number }) {
  const where: Prisma.ProductWhereInput = { userId };
  if (options?.productId) {
    where.id = options.productId;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: options?.limit ?? 50,
    select: { id: true },
  });

  const results: Array<{ productId: string; synced: boolean; reason?: string }> = [];
  for (const product of products) {
    const result = await syncProductToBlingById(userId, product.id);
    results.push({
      productId: product.id,
      synced: result.synced,
      reason: result.reason,
    });
  }

  return {
    total: products.length,
    synced: results.filter((item) => item.synced).length,
    failed: results.filter((item) => !item.synced).length,
    results,
  };
}

export async function processBlingWebhookEventRealtime(params: {
  eventId: string;
  event: string;
  userId: string;
  payload: Prisma.InputJsonValue;
}) {
  const normalizedEvent = normalizeEventName(params.event);
  const touchesProduct = normalizedEvent.includes("produto") || normalizedEvent.includes("estoque");

  if (!touchesProduct) {
    await prisma.blingWebhookEvent.updateMany({
      where: { eventId: params.eventId },
      data: { processedAt: new Date() },
    });
    return;
  }

  const identifiers = extractWebhookProductIdentifiers(params.payload);
  let applied = false;

  if (identifiers.blingProductId) {
    const details = await getBlingProductDetails(params.userId, identifiers.blingProductId).catch(
      () => null
    );
    const snapshot = details ? extractBlingProductFromBody(details) : null;
    const stockFromApi = await getBlingStockBalance(params.userId, identifiers.blingProductId);

    if (snapshot) {
      applied = await applyBlingProductSnapshot(
        params.userId,
        identifiers,
        {
          ...snapshot,
          stockQuantity: stockFromApi ?? snapshot.stockQuantity,
        }
      );
    } else if (stockFromApi !== null) {
      applied = await applyBlingProductSnapshot(params.userId, identifiers, {
        blingProductId: identifiers.blingProductId,
        code: identifiers.code,
        name: null,
        price: null,
        stockQuantity: stockFromApi,
      });
    }
  }

  if (!applied) {
    const payloadSnapshot = extractBlingProductFromBody(params.payload);
    if (payloadSnapshot) {
      applied = await applyBlingProductSnapshot(params.userId, identifiers, payloadSnapshot);
    }
  }

  await prisma.blingWebhookEvent.updateMany({
    where: { eventId: params.eventId },
    data: { processedAt: new Date() },
  });
}

export async function syncConfirmedOrdersToBling(userId: string, options?: { orderId?: string; limit?: number }) {
  const where: Prisma.OrderWhereInput = {
    userId,
    status: "CONFIRMED",
  };
  if (options?.orderId) {
    where.id = options.orderId;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: options?.limit ?? 20,
    select: { id: true },
  });

  const results: Array<{ orderId: string; synced: boolean; reason?: string }> = [];
  for (const order of orders) {
    const result = await syncOrderToBling(order.id);
    results.push({
      orderId: order.id,
      synced: result.synced,
      reason: result.reason,
    });
  }

  return {
    total: orders.length,
    synced: results.filter((item) => item.synced).length,
    failed: results.filter((item) => !item.synced).length,
    results,
  };
}
