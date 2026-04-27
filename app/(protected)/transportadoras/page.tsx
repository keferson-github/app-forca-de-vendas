import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { CarriersPageClient } from "@/components/transportadoras/carriers-page-client";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  page?: string;
  pageSize?: string;
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
  const requestedPage = parsePage(searchParams.page);
  const pageSize = parsePageSize(searchParams.pageSize);
  const where = buildWhere(session.user.id, query);

  const totalFiltered = await prisma.carrier.count({ where });

  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  const carriers = await prisma.carrier.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

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
      query={query}
      pagination={{
        currentPage,
        pageSize,
        totalItems: totalFiltered,
        totalPages,
      }}
    />
  );
}
