import { NextResponse } from "next/server";
import { processBlingWebhookEventRealtime } from "@/lib/bling-sync";
import {
  parseBlingWebhookPayload,
  verifyBlingWebhookSignature,
  type BlingWebhookPayload,
} from "@/lib/bling";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    provider: "bling",
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-bling-signature-256");

  if (!verifyBlingWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Assinatura invalida." }, { status: 401 });
  }

  let payload: BlingWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BlingWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  let event;
  try {
    event = parseBlingWebhookPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payload invalido." },
      { status: 400 }
    );
  }

  let connection = event.companyId
    ? await prisma.blingConnection.findFirst({
        where: { companyId: event.companyId },
        select: { userId: true },
      })
    : null;

  // Fallback para conexoes sem companyId preenchido no OAuth.
  if (!connection && event.companyId) {
    const pendingConnections = await prisma.blingConnection.findMany({
      where: { companyId: null },
      orderBy: { connectedAt: "desc" },
      take: 2,
      select: { userId: true },
    });

    if (pendingConnections.length === 1) {
      const [pendingConnection] = pendingConnections;
      await prisma.blingConnection.update({
        where: { userId: pendingConnection.userId },
        data: { companyId: event.companyId },
      });
      connection = { userId: pendingConnection.userId };
    }
  }

  await prisma.blingWebhookEvent.upsert({
    where: { eventId: event.eventId },
    create: {
      userId: connection?.userId,
      eventId: event.eventId,
      companyId: event.companyId,
      event: event.event,
      version: event.version,
      occurredAt: event.occurredAt,
      payload: event.payload,
    },
    update: {},
  });

  if (connection?.userId) {
    try {
      await processBlingWebhookEventRealtime({
        eventId: event.eventId,
        event: event.event,
        userId: connection.userId,
        payload: event.payload,
      });
    } catch (error) {
      await prisma.blingWebhookEvent.updateMany({
        where: { eventId: event.eventId },
        data: {
          payload: {
            ...(event.payload as Record<string, unknown>),
            processingError: error instanceof Error ? error.message : "Falha no processamento.",
          },
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
