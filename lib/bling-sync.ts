import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobAccessError, BlobStoreNotFoundError, put } from "@vercel/blob";
import { Prisma, type OrderStatus } from "@prisma/client";
import { blingRequest } from "@/lib/bling";
import { prisma } from "@/lib/prisma";

type UnknownRecord = Record<string, unknown>;

type BlingApiResponse = {
  data?: unknown;
};

const PRODUCT_IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const BLOB_TOKEN_PATTERN = /^vercel_blob_rw_[A-Za-z0-9_-]+$/;
const BLING_TEMPORARY_IMAGE_HOST_PATTERN = /(^|\.)s3\.amazonaws\.com$/i;

function getBlobToken() {
  const rawToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!rawToken) {
    return null;
  }

  const normalizedToken = rawToken.trim().replace(/^['"]|['"]$/g, "");
  if (!normalizedToken || !BLOB_TOKEN_PATTERN.test(normalizedToken)) {
    return null;
  }

  return normalizedToken;
}

function isManagedImagePath(imageUrl: string) {
  return imageUrl.startsWith("/uploads/products/") && !imageUrl.includes("..");
}

function isVercelBlobUrl(imageUrl: string) {
  return /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//i.test(imageUrl);
}

function isManagedProductImageUrl(imageUrl: string) {
  return isManagedImagePath(imageUrl) || isVercelBlobUrl(imageUrl);
}

function parseSignedUrlExpiresAtSeconds(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const expiresRaw = url.searchParams.get("Expires");

    if (!expiresRaw) {
      return null;
    }

    const expiresAt = Number(expiresRaw);
    if (!Number.isFinite(expiresAt)) {
      return null;
    }

    return Math.floor(expiresAt);
  } catch {
    return null;
  }
}

function isLikelyTemporaryBlingImageUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const hasSignature =
      url.searchParams.has("Signature") ||
      url.searchParams.has("AWSAccessKeyId") ||
      url.searchParams.has("X-Amz-Signature");
    const hasExpires =
      url.searchParams.has("Expires") ||
      url.searchParams.has("X-Amz-Expires");

    return BLING_TEMPORARY_IMAGE_HOST_PATTERN.test(url.hostname) && hasSignature && hasExpires;
  } catch {
    return false;
  }
}

function isSignedUrlExpiredOrExpiringSoon(imageUrl: string, thresholdSeconds = 60 * 60) {
  const expiresAt = parseSignedUrlExpiresAtSeconds(imageUrl);
  if (!expiresAt) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now + thresholdSeconds;
}

type ImageExtension = "jpeg" | "png" | "webp";

function detectImageTypeFromSignature(signature: Uint8Array): ImageExtension | null {
  const isJpeg = signature.length >= 3
    && signature[0] === 0xff
    && signature[1] === 0xd8
    && signature[2] === 0xff;

  if (isJpeg) {
    return "jpeg";
  }

  const isPng = signature.length >= 8
    && signature[0] === 0x89
    && signature[1] === 0x50
    && signature[2] === 0x4e
    && signature[3] === 0x47
    && signature[4] === 0x0d
    && signature[5] === 0x0a
    && signature[6] === 0x1a
    && signature[7] === 0x0a;

  if (isPng) {
    return "png";
  }

  const isWebp = signature.length >= 12
    && signature[0] === 0x52
    && signature[1] === 0x49
    && signature[2] === 0x46
    && signature[3] === 0x46
    && signature[8] === 0x57
    && signature[9] === 0x45
    && signature[10] === 0x42
    && signature[11] === 0x50;

  if (isWebp) {
    return "webp";
  }

  return null;
}

function extensionFromContentType(contentType: string | null): ImageExtension | null {
  if (!contentType) {
    return null;
  }

  const normalized = contentType.toLowerCase();

  if (normalized.includes("image/jpeg") || normalized.includes("image/jpg")) {
    return "jpeg";
  }

  if (normalized.includes("image/png")) {
    return "png";
  }

  if (normalized.includes("image/webp")) {
    return "webp";
  }

  return null;
}

function extensionFromUrl(imageUrl: string): ImageExtension | null {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname.toLowerCase();
    if (pathname.endsWith(".jpeg") || pathname.endsWith(".jpg")) {
      return "jpeg";
    }
    if (pathname.endsWith(".png")) {
      return "png";
    }
    if (pathname.endsWith(".webp")) {
      return "webp";
    }
  } catch {
    return null;
  }

  return null;
}

function sanitizePathSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function persistImageBuffer(options: {
  buffer: Buffer;
  extension: ImageExtension;
  contentType: string | null;
  userId: string;
  reference: string;
}) {
  const fileKey = `${Date.now()}-${randomUUID()}`;
  const fileName = `products/bling/${sanitizePathSegment(options.userId)}/${sanitizePathSegment(options.reference) || "item"}-${fileKey}.${options.extension}`;
  const blobToken = getBlobToken();

  if (blobToken) {
    try {
      const uploaded = await put(fileName, options.buffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: options.contentType ?? `image/${options.extension}`,
        token: blobToken,
      });

      return uploaded.url;
    } catch (error) {
      if (!(error instanceof BlobAccessError) && !(error instanceof BlobStoreNotFoundError)) {
        console.error("Falha no upload da capa do produto para Blob.", error);
      }
    }
  }

  if (process.env.VERCEL === "1") {
    throw new Error("Não foi possível persistir imagem no ambiente Vercel sem Blob configurado.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDir, { recursive: true });

  const localFileName = `${sanitizePathSegment(options.reference) || "item"}-${fileKey}.${options.extension}`;
  const absolutePath = path.join(uploadDir, localFileName);

  await writeFile(absolutePath, options.buffer);
  return `/uploads/products/${localFileName}`;
}

async function persistBlingImageUrl(options: {
  userId: string;
  reference: string;
  sourceUrl: string;
}) {
  const response = await fetch(options.sourceUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem do Bling (${response.status}).`);
  }

  const contentType = response.headers.get("content-type");
  const rawBuffer = Buffer.from(await response.arrayBuffer());

  if (rawBuffer.length === 0) {
    throw new Error("Imagem do Bling vazia.");
  }

  if (rawBuffer.length > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
    throw new Error("Imagem do Bling excede o limite de tamanho permitido.");
  }

  const signatureType = detectImageTypeFromSignature(rawBuffer.subarray(0, 12));
  const extension =
    signatureType ??
    extensionFromContentType(contentType) ??
    extensionFromUrl(options.sourceUrl);

  if (!extension) {
    throw new Error("Formato de imagem do Bling não suportado.");
  }

  return persistImageBuffer({
    buffer: rawBuffer,
    extension,
    contentType,
    userId: options.userId,
    reference: options.reference,
  });
}

function shouldPersistBlingImage(params: {
  currentImageUrl?: string | null;
  incomingImageUrl?: string | null;
  force?: boolean;
}) {
  const incoming = params.incomingImageUrl;
  if (!incoming) {
    return false;
  }

  if (params.force) {
    return true;
  }

  const current = params.currentImageUrl;
  if (!current) {
    return true;
  }

  if (isManagedProductImageUrl(current)) {
    return false;
  }

  if (isLikelyTemporaryBlingImageUrl(current)) {
    return isSignedUrlExpiredOrExpiringSoon(current);
  }

  return true;
}

async function resolveImageUrlForProductSnapshot(params: {
  userId: string;
  currentImageUrl?: string | null;
  incomingImageUrl?: string | null;
  blingProductId?: string | null;
  code?: string | null;
  force?: boolean;
}) {
  const incomingImageUrl = params.incomingImageUrl;
  if (!incomingImageUrl) {
    return null;
  }

  if (
    !shouldPersistBlingImage({
      currentImageUrl: params.currentImageUrl,
      incomingImageUrl,
      force: params.force,
    })
  ) {
    return params.currentImageUrl ?? incomingImageUrl;
  }

  const reference = params.blingProductId ?? params.code ?? "produto";

  try {
    return await persistBlingImageUrl({
      userId: params.userId,
      reference,
      sourceUrl: incomingImageUrl,
    });
  } catch (error) {
    console.error(
      `Falha ao persistir imagem do produto ${reference}. Mantendo URL original do Bling.`,
      error
    );
    return incomingImageUrl;
  }
}

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

function extractUrlFromImageEntry(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return (
    toStringValue(record.linkMiniatura) ??
    toStringValue(record.link) ??
    toStringValue(record.url) ??
    toStringValue(record.imagemURL) ??
    null
  );
}

function extractBlingImageUrlFromBody(body: unknown) {
  const record = deepFindFirst(body, (candidate) => {
    if (
      candidate.imagemURL !== undefined ||
      candidate.midia !== undefined ||
      candidate.imagens !== undefined
    ) {
      return candidate;
    }

    return null;
  });
  const product = asRecord(record);
  if (!product) {
    return null;
  }

  const directImageUrl = toStringValue(product.imagemURL);
  if (directImageUrl) {
    return directImageUrl;
  }

  const media = asRecord(product.midia);
  const images = asRecord(media?.imagens) ?? asRecord(product.imagens);
  const candidates = [
    images?.internas,
    images?.externas,
    images?.imagensURL,
    product.imagensURL,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    for (const image of candidate) {
      const imageUrl = extractUrlFromImageEntry(image);
      if (imageUrl) {
        return imageUrl;
      }
    }
  }

  return null;
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

  const stock = asRecord(product.estoque);

  return {
    blingProductId: toStringValue(product.id),
    code: toStringValue(product.codigo) ?? toStringValue(product.code),
    name: toStringValue(product.nome) ?? toStringValue(product.name),
    imageUrl: extractBlingImageUrlFromBody(body),
    price:
      toNumberValue(product.preco) ??
      toNumberValue(product.valor) ??
      toNumberValue(product.precoVenda) ??
      null,
    stockQuantity:
      toNumberValue(product.saldoVirtualTotal) ??
      toNumberValue(product.saldoFisicoTotal) ??
      toNumberValue(stock?.saldoVirtualTotal) ??
      toNumberValue(stock?.saldoFisicoTotal) ??
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

function extractBlingStockBalancesFromBody(body: unknown) {
  const balances = new Map<string, number>();
  const data = asRecord(body)?.data;

  if (!Array.isArray(data)) {
    return balances;
  }

  for (const item of data) {
    const record = asRecord(item);
    if (!record) {
      continue;
    }

    const product = asRecord(record.produto);
    const productId = toStringValue(product?.id) ?? toStringValue(record.idProduto);
    const quantity =
      toNumberValue(record.saldoVirtualTotal) ??
      toNumberValue(record.saldoFisicoTotal) ??
      extractStockFromBody(record);

    if (productId && quantity !== null) {
      balances.set(productId, quantity);
    }
  }

  return balances;
}

async function getBlingStockBalances(userId: string, blingProductIds: string[]) {
  const uniqueIds = Array.from(new Set(blingProductIds.filter(Boolean)));
  const balances = new Map<string, number>();

  for (let index = 0; index < uniqueIds.length; index += 100) {
    const chunk = uniqueIds.slice(index, index + 100);
    const params = new URLSearchParams();
    for (const id of chunk) {
      params.append("idsProdutos[]", id);
    }

    try {
      const response = await blingRequest<BlingApiResponse>(
        userId,
        `/estoques/saldos?${params.toString()}`
      );
      for (const [productId, quantity] of extractBlingStockBalancesFromBody(response)) {
        balances.set(productId, quantity);
      }
    } catch {
      continue;
    }
  }

  return balances;
}

async function getBlingStockBalance(userId: string, blingProductId: string) {
  return (await getBlingStockBalances(userId, [blingProductId])).get(blingProductId) ?? null;
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
    imageUrl?: string | null;
  }
) {
  const product = await getProductByIdentifiers(userId, identifiers);

  if (product) {
    const payload: Prisma.ProductUpdateInput = {
      lastBlingSyncAt: new Date(),
      lastBlingError: null,
    };

    if (snapshot.blingProductId) payload.blingProductId = snapshot.blingProductId;
    if (snapshot.code) payload.code = snapshot.code;
    if (snapshot.name) payload.name = snapshot.name;
    if (snapshot.imageUrl) {
      const persistedImageUrl = await resolveImageUrlForProductSnapshot({
        userId,
        currentImageUrl: product.imageUrl,
        incomingImageUrl: snapshot.imageUrl,
        blingProductId: snapshot.blingProductId ?? identifiers.blingProductId,
        code: snapshot.code ?? identifiers.code,
      });

      if (persistedImageUrl && persistedImageUrl !== product.imageUrl) {
        payload.imageUrl = persistedImageUrl;
      }
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

  // Se nao existe, tenta criar (Upsert funcional)
  // Para criar, precisamos minimamente de code e name
  if (!snapshot.code || !snapshot.name) {
    // Se nao temos dados suficientes para criar, mas temos o ID do Bling,
    // tentamos buscar os detalhes completos antes de desistir
    if (snapshot.blingProductId) {
      try {
        const details = await getBlingProductDetails(userId, snapshot.blingProductId);
        const fullSnapshot = extractBlingProductFromBody(details);
        if (fullSnapshot && fullSnapshot.code && fullSnapshot.name) {
          return applyBlingProductSnapshot(userId, identifiers, {
            ...fullSnapshot,
            stockQuantity: snapshot.stockQuantity ?? fullSnapshot.stockQuantity,
          });
        }
      } catch {
        return false;
      }
    }
    return false;
  }

  const persistedImageUrl = await resolveImageUrlForProductSnapshot({
    userId,
    currentImageUrl: null,
    incomingImageUrl: snapshot.imageUrl ?? null,
    blingProductId: snapshot.blingProductId ?? identifiers.blingProductId,
    code: snapshot.code ?? identifiers.code,
  });

  await prisma.product.create({
    data: {
      userId,
      blingProductId: snapshot.blingProductId,
      code: snapshot.code,
      name: snapshot.name,
      imageUrl: persistedImageUrl,
      price: new Prisma.Decimal((snapshot.price ?? 0).toFixed(2)),
      stockQuantity: new Prisma.Decimal((snapshot.stockQuantity ?? 0).toFixed(3)),
      category: "ACESSORIOS", // Default para novos produtos vindos do Bling
      subcategory: "GERAL",
      lastBlingSyncAt: new Date(),
    },
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

  if (order.items.length === 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: { lastBlingError: "Pedido sem itens para envio ao Bling." },
    });
    return { synced: false, reason: "Pedido sem itens para envio ao Bling." };
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

type BillOrderOptions = {
  maxAttempts?: number;
};

function resolveBlingBillingSituationId() {
  const raw = process.env.BLING_BILLING_SITUATION_ID;

  if (!raw) {
    return 9;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 9;
  }

  return Math.floor(parsed);
}

async function markOrderBillingFailure(orderId: string, reason: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      lastBlingError: reason,
    },
  });
}

async function sendBillOrderRequestToBling(userId: string, blingOrderId: string) {
  const situationId = resolveBlingBillingSituationId();
  const endpoints = [
    {
      path: `/pedidos/vendas/${blingOrderId}/situacoes`,
      method: "POST",
      body: {
        situacao: {
          id: situationId,
        },
      },
    },
    {
      path: `/pedidos/vendas/${blingOrderId}`,
      method: "PATCH",
      body: {
        situacao: {
          id: situationId,
        },
      },
    },
    {
      path: `/pedidos/vendas/${blingOrderId}`,
      method: "PUT",
      body: {
        situacao: {
          id: situationId,
        },
      },
    },
  ] as const;

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      await blingRequest(userId, endpoint.path, {
        method: endpoint.method,
        body: JSON.stringify(endpoint.body),
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao faturar pedido no Bling.");
}

export async function billConfirmedOrderInBling(
  userId: string,
  orderId: string,
  options?: BillOrderOptions,
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      status: true,
      billedAt: true,
      blingOrderId: true,
      items: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!order) {
    return { billed: false, reason: "Pedido nao encontrado ou sem permissao." };
  }

  if (order.status !== ("CONFIRMED" satisfies OrderStatus)) {
    return { billed: false, reason: "Somente pedidos confirmados podem ser faturados." };
  }

  if (order.items.length === 0) {
    return { billed: false, reason: "Pedido sem itens nao pode ser faturado." };
  }

  if (order.billedAt) {
    return { billed: true, alreadyBilled: true };
  }

  let blingOrderId = order.blingOrderId;

  if (!blingOrderId) {
    const syncResult = await syncOrderToBling(order.id);
    if (!syncResult.synced) {
      return {
        billed: false,
        reason: syncResult.reason ?? "Falha ao sincronizar pedido com o Bling antes do faturamento.",
      };
    }

    const refreshedOrder = await prisma.order.findUnique({
      where: {
        id: order.id,
      },
      select: {
        blingOrderId: true,
      },
    });

    blingOrderId = refreshedOrder?.blingOrderId ?? null;
  }

  if (!blingOrderId) {
    return { billed: false, reason: "Pedido sem identificador no Bling para faturamento." };
  }

  const maxAttempts = Math.min(Math.max(options?.maxAttempts ?? 2, 1), 3);
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await sendBillOrderRequestToBling(userId, blingOrderId);

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          billedAt: new Date(),
          lastBlingSyncAt: new Date(),
          lastBlingError: null,
        },
      });

      return { billed: true, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Falha ao faturar pedido no Bling.";
    }
  }

  const reason = lastError ?? "Falha ao faturar pedido no Bling.";
  await markOrderBillingFailure(order.id, reason);

  return {
    billed: false,
    attempts: maxAttempts,
    reason,
  };
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

/**
 * Realiza a sincronização incremental de produtos do Bling para o banco local.
 * Busca produtos alterados em um intervalo de tempo específico.
 */
export async function syncProductsFromBlingIncremental(userId: string, minutesLookback = 15) {
  const now = new Date();
  const startTime = new Date(now.getTime() - minutesLookback * 60 * 1000);
  
  const formatBlingDate = (date: Date) => {
    return date.toISOString().replace("T", " ").split(".")[0];
  };

  const params = new URLSearchParams({
    dataAlteracaoInicial: formatBlingDate(startTime),
    dataAlteracaoFinal: formatBlingDate(now),
    limite: "100",
  });

  const response = await blingRequest<{ data: unknown[] }>(userId, `/produtos?${params.toString()}`);
  const blingProducts = response.data || [];
  const snapshots = blingProducts
    .map((item) => extractBlingProductFromBody(item))
    .filter((snapshot): snapshot is NonNullable<ReturnType<typeof extractBlingProductFromBody>> =>
      Boolean(snapshot)
    );
  const stockBalances = await getBlingStockBalances(
    userId,
    snapshots
      .map((snapshot) => snapshot.blingProductId)
      .filter((id): id is string => Boolean(id))
  );

  const results = {
    processed: 0,
    updated: 0,
    created: 0,
    failed: 0,
  };

  for (const snapshot of snapshots) {
    results.processed++;
    try {
      const stock = snapshot.blingProductId
        ? stockBalances.get(snapshot.blingProductId) ?? null
        : null;
      
      const identifiers = { 
        blingProductId: snapshot.blingProductId, 
        code: snapshot.code 
      };

      const applied = await applyBlingProductSnapshot(userId, identifiers, {
        ...snapshot,
        stockQuantity: stock ?? snapshot.stockQuantity
      });

      if (applied) {
        // Verificar se foi update ou create (baseado no que o applyBlingProductSnapshot faria)
        const existsLocally = await getProductByIdentifiers(userId, identifiers);
        if (existsLocally) results.updated++;
        else results.created++;
      } else {
        results.failed++;
      }
    } catch {
      results.failed++;
    }
  }

  return results;
}

/**
 * Realiza a sincronização completa de todos os produtos do Bling para o banco local.
 * Percorre todas as páginas de produtos.
 */
export async function syncProductsFromBlingFull(userId: string) {
  let pagina = 1;
  const limite = 100;
  let hasMore = true;

  const results = {
    processed: 0,
    updated: 0,
    created: 0,
    failed: 0,
  };

  while (hasMore) {
    try {
      const response = await blingRequest<{ data: unknown[] }>(userId, `/produtos?pagina=${pagina}&limite=${limite}`);
      const blingProducts = response.data || [];
      const snapshots = blingProducts
        .map((item) => extractBlingProductFromBody(item))
        .filter((snapshot): snapshot is NonNullable<ReturnType<typeof extractBlingProductFromBody>> =>
          Boolean(snapshot)
        );
      const stockBalances = await getBlingStockBalances(
        userId,
        snapshots
          .map((snapshot) => snapshot.blingProductId)
          .filter((id): id is string => Boolean(id))
      );

      if (blingProducts.length === 0) {
        hasMore = false;
        break;
      }

      for (const snapshot of snapshots) {
        results.processed++;
        try {
          const identifiers = { 
            blingProductId: snapshot.blingProductId, 
            code: snapshot.code 
          };

          const stock = snapshot.blingProductId
            ? stockBalances.get(snapshot.blingProductId) ?? null
            : null;

          const applied = await applyBlingProductSnapshot(userId, identifiers, {
            ...snapshot,
            stockQuantity: stock ?? snapshot.stockQuantity,
          });

          if (applied) {
            const existsLocally = await getProductByIdentifiers(userId, identifiers);
            if (existsLocally) results.updated++;
            else results.created++;
          } else {
            results.failed++;
          }
        } catch {
          results.failed++;
        }
      }

      if (blingProducts.length < limite) {
        hasMore = false;
      } else {
        pagina++;
      }
    } catch (error) {
      console.error(`Erro na pagina ${pagina} do Full Sync:`, error);
      hasMore = false;
    }
  }

  return results;
}

export async function syncProductImagesFromBling(
  userId: string,
  options?: { limit?: number; force?: boolean }
) {
  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);
  const force = options?.force ?? false;

  const whereClause: Prisma.ProductWhereInput = force
    ? {
        userId,
        blingProductId: { not: null },
      }
    : {
        userId,
        blingProductId: { not: null },
        OR: [
          { imageUrl: null },
          { imageUrl: { startsWith: "https://orgbling.s3.amazonaws.com/" } },
        ],
      };

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      code: true,
      blingProductId: true,
      imageUrl: true,
    },
  });

  const results = {
    processed: 0,
    updated: 0,
    failed: 0,
  };

  for (const product of products) {
    results.processed++;

    if (!product.blingProductId) {
      results.failed++;
      continue;
    }

    try {
      const details = await getBlingProductDetails(userId, product.blingProductId);
      const blingImageUrl = extractBlingImageUrlFromBody(details);

      if (!blingImageUrl) {
        continue;
      }

      const persistedImageUrl = await resolveImageUrlForProductSnapshot({
        userId,
        currentImageUrl: product.imageUrl,
        incomingImageUrl: blingImageUrl,
        blingProductId: product.blingProductId,
        code: product.code,
        force,
      });

      if (!persistedImageUrl || persistedImageUrl === product.imageUrl) {
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: {
          imageUrl: persistedImageUrl,
          lastBlingSyncAt: new Date(),
          lastBlingError: null,
        },
      });
      results.updated++;
    } catch {
      results.failed++;
    }
  }

  return results;
}
