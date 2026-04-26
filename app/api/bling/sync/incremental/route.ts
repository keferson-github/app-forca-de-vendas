import { NextResponse } from "next/server";
import { syncProductsFromBlingIncremental } from "@/lib/bling-sync";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint para sincronização incremental de produtos (Bling -> App).
 * Pode ser chamado via CRON a cada 5 minutos.
 * Exemplo: GET /api/bling/sync/incremental?minutes=10
 */
export async function GET(request: Request) {
  // Opcional: Adicionar uma chave de segurança via Header para evitar chamadas externas
  // const authHeader = request.headers.get("x-cron-key");
  // if (authHeader !== process.env.CRON_SECRET) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const minutes = parseInt(searchParams.get("minutes") || "15", 10);

  try {
    // Buscar todas as conexões ativas do Bling
    const connections = await prisma.blingConnection.findMany({
      select: { userId: true },
    });

    const results = [];

    for (const connection of connections) {
      const syncResult = await syncProductsFromBlingIncremental(connection.userId, minutes);
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
    console.error("Erro na sincronização incremental:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
