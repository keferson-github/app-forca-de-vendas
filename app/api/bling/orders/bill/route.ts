import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { billConfirmedOrderInBling } from "@/lib/bling-sync";

function parseMaxAttempts(value: string | null) {
  if (!value) {
    return 2;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 2;
  }

  return Math.min(Math.floor(parsed), 3);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = (searchParams.get("orderId") ?? "").trim();
  const maxAttempts = parseMaxAttempts(searchParams.get("maxAttempts"));

  if (!orderId) {
    return NextResponse.json({ error: "Informe o orderId." }, { status: 400 });
  }

  const result = await billConfirmedOrderInBling(session.user.id, orderId, {
    maxAttempts,
  });

  if (!result.billed) {
    return NextResponse.json(
      {
        error: result.reason ?? "Falha ao faturar pedido no Bling.",
        attempts: result.attempts ?? maxAttempts,
      },
      { status: 422 },
    );
  }

  return NextResponse.json(result);
}
