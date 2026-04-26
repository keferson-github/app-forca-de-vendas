import { NextResponse } from "next/server";
import { syncProductsFromBlingFull } from "@/lib/bling-sync";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint para sincronização COMPLETA de produtos (Bling -> App).
 * Pode ser chamado manualmente ou via CRON diário.
 */
export async function GET(request: Request) {
  try {
    const connections = await prisma.blingConnection.findMany({
      select: { userId: true },
    });

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
