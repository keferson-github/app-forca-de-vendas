import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { BlobAccessError, BlobStoreNotFoundError, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_PDF_SIZE_BYTES = 16 * 1024 * 1024;
const BLOB_TOKEN_PATTERN = /^vercel_blob_rw_[A-Za-z0-9_-]+$/;

function normalizeConfigValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/^['"]|['"]$/g, "");
  return normalized || null;
}

function normalizeWhatsAppNumber(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits.length >= 12 ? digits : null;
}

function readEnvValue(candidates: string[]) {
  for (const name of candidates) {
    const value = process.env[name];
    const normalized = normalizeConfigValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function readStringField(formData: FormData, candidates: string[]) {
  for (const candidate of candidates) {
    const field = formData.get(candidate);
    if (typeof field === "string") {
      const normalized = normalizeConfigValue(field);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

function getEvolutionConfig(options?: { requestInstance?: string | null }) {
  const baseUrl = readEnvValue([
    "EVOLUTION_API_URL",
    "EVOLUTION_BASE_URL",
    "WHATSAPP_EVOLUTION_API_URL",
    "NEXT_PUBLIC_EVOLUTION_API_URL",
  ])?.replace(/\/+$/g, "");
  const requestInstance = normalizeConfigValue(options?.requestInstance);
  const envInstance = readEnvValue([
    "EVOLUTION_INSTANCE",
    "EVOLUTION_INSTANCE_NAME",
    "EVOLUTION_INSTANCE_ID",
    "EVOLUTION_INSTANCEID",
    "EVOLUTION_INSTANC",
    "EVOLUTION_INSTANCIA",
    "EVOLUTION_INSTACE",
    "WHATSAPP_EVOLUTION_INSTANCE",
    "WHATSAPP_EVOLUTION_INSTANCE_NAME",
    "NEXT_PUBLIC_EVOLUTION_INSTANCE",
    "NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME",
    "NEXT_PUBLIC_WHATSAPP_EVOLUTION_INSTANCE",
  ]);
  const instance = requestInstance ?? envInstance;
  const apiKey = readEnvValue([
    "EVOLUTION_API_KEY",
    "EVOLUTION_APIKEY",
    "WHATSAPP_EVOLUTION_API_KEY",
  ]);

  const missing: string[] = [];
  if (!baseUrl) {
    missing.push("EVOLUTION_API_URL");
  }
  if (!instance) {
    missing.push("EVOLUTION_INSTANCE");
  }
  if (!apiKey) {
    missing.push("EVOLUTION_API_KEY");
  }

  return {
    baseUrl,
    instance,
    apiKey,
    missing,
  };
}

function mapMissingWhatsAppConfig(missing: string[]) {
  const mapped = missing.map((item) => {
    if (item === "EVOLUTION_API_URL") {
      return "url";
    }
    if (item === "EVOLUTION_INSTANCE") {
      return "instance";
    }
    if (item === "EVOLUTION_API_KEY") {
      return "token";
    }
    return item.toLowerCase();
  });

  return [...new Set(mapped)];
}

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

async function persistOrderPdf(options: {
  userId: string;
  orderId: string;
  fileName: string;
  buffer: Buffer;
}) {
  const safeFileName = options.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const fileKey = `orders/${options.userId}/${options.orderId}/${Date.now()}-${randomUUID()}-${safeFileName}`;
  const blobToken = getBlobToken();

  if (blobToken) {
    try {
      const uploaded = await put(fileKey, options.buffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/pdf",
        token: blobToken,
      });

      return uploaded.url;
    } catch (error) {
      if (!(error instanceof BlobAccessError) && !(error instanceof BlobStoreNotFoundError)) {
        console.error("Falha ao persistir PDF em Blob.", error);
      }
    }
  }

  if (process.env.VERCEL === "1") {
    return null;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "orders");
  await mkdir(uploadDir, { recursive: true });

  const localFileName = `${Date.now()}-${randomUUID()}-${safeFileName}`;
  const absolutePath = path.join(uploadDir, localFileName);
  await writeFile(absolutePath, options.buffer);

  return `/uploads/orders/${localFileName}`;
}

function extractProviderMessageId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typed = payload as {
    key?: {
      id?: unknown;
    };
  };

  return typeof typed.key?.id === "string" ? typed.key.id : null;
}

function isHttpUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value);
}

function extractProviderErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typed = payload as {
    response?: {
      message?: unknown;
    };
    message?: unknown;
    error?: unknown;
  };

  if (Array.isArray(typed.response?.message)) {
    const messages = typed.response.message
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  if (typeof typed.message === "string" && typed.message.trim()) {
    return typed.message.trim();
  }

  if (typeof typed.error === "string" && typed.error.trim()) {
    return typed.error.trim();
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const orderId = String(formData.get("orderId") ?? "").trim();
    const pdfFile = formData.get("pdfFile");
    const instanceFromRequest =
      readStringField(formData, [
        "evolutionInstance",
        "instance",
        "instanceName",
        "evolution_instance",
      ])
      ?? normalizeConfigValue(request.headers.get("x-evolution-instance"));

    const evolutionConfig = getEvolutionConfig({
      requestInstance: instanceFromRequest,
    });

    if (
      !evolutionConfig.baseUrl
      || !evolutionConfig.instance
      || !evolutionConfig.apiKey
    ) {
      return NextResponse.json(
        {
          error: "Canal de WhatsApp nao configurado. Defina URL, instancia e token.",
          missing: mapMissingWhatsAppConfig(evolutionConfig.missing),
        },
        { status: 500 },
      );
    }

    if (!orderId) {
      return NextResponse.json({ error: "Pedido nao identificado." }, { status: 400 });
    }

    if (!pdfFile || typeof pdfFile === "string" || pdfFile.size === 0) {
      return NextResponse.json({ error: "Arquivo PDF nao enviado." }, { status: 400 });
    }

    if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json({ error: "PDF excede o limite de 16MB." }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentTerm: true,
        customer: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
    }

    const destinationPhone = normalizeWhatsAppNumber(order.customer.phone);

    if (!destinationPhone) {
      return NextResponse.json({ error: "Cliente sem telefone valido para WhatsApp." }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const fileName = pdfFile.name?.trim() || `pedido-${order.orderNumber}.pdf`;

    let dispatchLogId: string | null = null;

    try {
      const dispatchLog = await prisma.whatsappDispatchLog.create({
        data: {
          userId: session.user.id,
          orderId: order.id,
          destinationPhone: destinationPhone,
          status: "PENDING",
        },
        select: {
          id: true,
        },
      });
      dispatchLogId = dispatchLog.id;
    } catch (error) {
      // Em caso de schema/migration pendente em producao, nao bloquear envio.
      console.warn("Nao foi possivel criar log inicial de envio WhatsApp.", error);
    }

    let providerPayload: unknown = null;
    let providerResponseText: string | null = null;

    try {
      const documentUrl = await persistOrderPdf({
        userId: session.user.id,
        orderId: order.id,
        fileName,
        buffer: pdfBuffer,
      });

      let orderDocumentId: string | null = null;

      if (documentUrl) {
        try {
          const document = await prisma.orderDocument.create({
            data: {
              userId: session.user.id,
              orderId: order.id,
              type: "DECLARACAO_CONTEUDO",
              fileName,
              fileUrl: documentUrl,
              generatedByUserId: session.user.id,
            },
            select: {
              id: true,
            },
          });

          orderDocumentId = document.id;
        } catch (error) {
          // Nao impedir envio caso tabela de documentos nao exista ainda.
          console.warn("Nao foi possivel persistir documento do pedido.", error);
        }
      }

      const mediaSource = isHttpUrl(documentUrl)
        ? documentUrl
        : pdfBuffer.toString("base64");
      const endpoint = `${evolutionConfig.baseUrl}/message/sendMedia/${encodeURIComponent(evolutionConfig.instance)}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: evolutionConfig.apiKey,
        },
        body: JSON.stringify({
          number: destinationPhone,
          mediatype: "document",
          mimetype: "application/pdf",
          caption: `Pedido #${order.orderNumber} - Total ${Number(order.total).toFixed(2)}`,
          media: mediaSource,
          fileName,
        }),
      });

      providerResponseText = await response.text();

      if (providerResponseText) {
        try {
          providerPayload = JSON.parse(providerResponseText);
        } catch {
          providerPayload = { raw: providerResponseText };
        }
      }

      if (!response.ok) {
        const providerErrorMessage = extractProviderErrorMessage(providerPayload);
        if (providerErrorMessage) {
          console.error("Falha no servico de envio WhatsApp.", {
            status: response.status,
            providerErrorMessage,
          });
        }
        throw new Error(
          `Falha no envio de WhatsApp (status ${response.status}).`
        );
      }

      if (dispatchLogId) {
        try {
          await prisma.whatsappDispatchLog.update({
            where: {
              id: dispatchLogId,
            },
            data: {
              orderDocumentId,
              status: "SENT",
              sentAt: new Date(),
              providerMessageId: extractProviderMessageId(providerPayload),
              providerPayload: providerPayload
                ? (providerPayload as Prisma.InputJsonValue)
                : undefined,
              errorMessage: null,
            },
          });
        } catch (error) {
          console.warn("Nao foi possivel atualizar log de envio WhatsApp (SENT).", error);
        }
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        destinationPhone,
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Falha ao enviar PDF do pedido por WhatsApp.";

      if (dispatchLogId) {
        try {
          await prisma.whatsappDispatchLog.update({
            where: {
              id: dispatchLogId,
            },
            data: {
              status: "FAILED",
              errorMessage,
              providerPayload: providerPayload
                ? (providerPayload as Prisma.InputJsonValue)
                : providerResponseText
                  ? ({ raw: providerResponseText } as Prisma.InputJsonValue)
                  : undefined,
            },
          });
        } catch (logError) {
          console.warn("Nao foi possivel atualizar log de envio WhatsApp (FAILED).", logError);
        }
      }

      return NextResponse.json(
        { error: `Nao foi possivel enviar o pedido por WhatsApp. ${errorMessage}` },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Falha interna na rota /api/pedidos/whatsapp/send", error);
    const message = error instanceof Error ? error.message : "Erro interno inesperado.";
    return NextResponse.json(
      { error: `Falha interna ao processar envio WhatsApp. ${message}` },
      { status: 500 },
    );
  }
}
