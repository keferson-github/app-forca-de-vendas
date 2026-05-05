import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const AUTOCOMPLETE_LIMIT = 8;

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 1) {
    return NextResponse.json({ items: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { code: { startsWith: query, mode: "insensitive" } },
        { name: { startsWith: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: AUTOCOMPLETE_LIMIT,
    select: {
      id: true,
      code: true,
      name: true,
      price: true,
      stockQuantity: true,
    },
  });

  return NextResponse.json({
    items: products.map((product) => ({
      id: product.id,
      code: product.code,
      name: product.name,
      price: Number(product.price),
      stockQuantity: Number(product.stockQuantity),
    })),
  });
}
