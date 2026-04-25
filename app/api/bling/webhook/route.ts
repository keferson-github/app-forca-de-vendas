import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  let event;
  try {
    event = parseBlingWebhookPayload(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payload inválido." },
      { status: 400 }
    );
  }

  const connection = event.companyId
    ? await prisma.blingConnection.findFirst({
        where: { companyId: event.companyId },
        select: { userId: true },
      })
    : null;

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

  return NextResponse.json({ received: true });
}
