import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function redirectToIntegration(requestUrl: string, status: string) {
  const url = new URL("/integracoes/bling", requestUrl);
  url.searchParams.set("bling", status);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await prisma.blingConnection.deleteMany({
      where: { userId: session.user.id },
    });

    return redirectToIntegration(request.url, "disconnected");
  } catch (error) {
    console.error("Erro ao desconectar integracao do Bling", error);
    return redirectToIntegration(request.url, "disconnect-error");
  }
}
