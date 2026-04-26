import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncConfirmedOrdersToBling } from "@/lib/bling-sync";

function parseLimit(value: string | null) {
  if (!value) {
    return 20;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 20;
  }

  return Math.min(Math.floor(parsed), 100);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const orderId = searchParams.get("orderId");

  const result = await syncConfirmedOrdersToBling(session.user.id, {
    orderId: orderId?.trim() || undefined,
    limit,
  });

  return NextResponse.json(result);
}
