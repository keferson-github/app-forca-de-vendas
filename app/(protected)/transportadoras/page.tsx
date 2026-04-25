import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { CarriersPageClient } from "@/components/transportadoras/carriers-page-client";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
}>;

function buildWhere(userId: string, query: string) {
  const where: Prisma.CarrierWhereInput = {
    userId,
  };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { contact: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
    ];
  }

  return where;
}

export default async function TransportadorasPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const query = (searchParams.q ?? "").trim();
  const where = buildWhere(session.user.id, query);

  const [carriers, total, withContact, withPhone] = await prisma.$transaction([
    prisma.carrier.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
    prisma.carrier.count({ where: { userId: session.user.id } }),
    prisma.carrier.count({
      where: {
        userId: session.user.id,
        contact: { not: null },
      },
    }),
    prisma.carrier.count({
      where: {
        userId: session.user.id,
        phone: { not: null },
      },
    }),
  ]);

  return (
    <CarriersPageClient
      carriers={carriers.map((carrier) => ({
        id: carrier.id,
        name: carrier.name,
        contact: carrier.contact,
        phone: carrier.phone,
        notes: carrier.notes,
        createdAt: carrier.createdAt.toISOString(),
        updatedAt: carrier.updatedAt.toISOString(),
        ordersCount: carrier._count.orders,
      }))}
      stats={{
        total,
        withContact,
        withPhone,
      }}
      query={query}
    />
  );
}
