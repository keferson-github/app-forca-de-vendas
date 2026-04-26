import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncProductsToBling } from "@/lib/bling-sync";

function parseLimit(value: string | null) {
  if (!value) {
    return 50;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 50;
  }

  return Math.min(Math.floor(parsed), 200);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const productId = searchParams.get("productId");

  const result = await syncProductsToBling(session.user.id, {
    productId: productId?.trim() || undefined,
    limit,
  });

  return NextResponse.json(result);
}
