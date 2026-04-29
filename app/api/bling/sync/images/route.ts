import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncProductImagesFromBling } from "@/lib/bling-sync";
import { prisma } from "@/lib/prisma";

function parseLimit(value: string | null) {
  if (!value) {
    return 25;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(Math.floor(parsed), 100);
}

function hasValidCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const provided =
    request.headers.get("x-cron-secret")?.trim() ??
    request.headers.get("x-cron-key")?.trim();

  return Boolean(provided && provided === secret);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const isCronRequest = hasValidCronSecret(request);
  const session = isCronRequest ? null : await auth();
  const sessionUserId = session?.user?.id ?? null;

  if (!isCronRequest && !sessionUserId) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const connections: Array<{ userId: string }> = isCronRequest
    ? await prisma.blingConnection.findMany({
        select: { userId: true },
      })
    : [{ userId: sessionUserId! }];

  const details = [];
  for (const connection of connections) {
    const result = await syncProductImagesFromBling(connection.userId, limit);
    details.push({
      userId: connection.userId,
      ...result,
    });
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    connectionsProcessed: connections.length,
    details,
  });
}
