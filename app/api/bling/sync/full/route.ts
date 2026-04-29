import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncProductsFromBlingFull } from "@/lib/bling-sync";
import { prisma } from "@/lib/prisma";

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

/**
 * Endpoint para sincronização COMPLETA de produtos (Bling -> App).
 * Pode ser chamado manualmente ou via CRON diário.
 */
export async function GET(request: Request) {
  const isCronRequest = hasValidCronSecret(request);
  const session = isCronRequest ? null : await auth();
  const sessionUserId = session?.user?.id ?? null;
  if (!isCronRequest && !sessionUserId) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  try {
    const connections: Array<{ userId: string }> = isCronRequest
      ? await prisma.blingConnection.findMany({
          select: { userId: true },
        })
      : [{ userId: sessionUserId! }];

    const results = [];

    for (const connection of connections) {
      const syncResult = await syncProductsFromBlingFull(connection.userId);
      results.push({
        userId: connection.userId,
        ...syncResult,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionsProcessed: connections.length,
      details: results,
    });
  } catch (error) {
    console.error("Erro na sincronização completa:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
