import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { OrdersPageClient } from "@/components/pedidos/orders-page-client";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  page?: string;
}>;

const PAGE_SIZE = 12;

function parsePage(value?: string) {
  const parsed = Number(value ?? "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function buildWhere(userId: string, query: string) {
  const where: Prisma.OrderWhereInput = {
    userId,
  };

  if (!query) {
    return where;
  }

  const normalized = query.trim();
  const parsedOrderNumber = Number(normalized);
  const or: Prisma.OrderWhereInput[] = [
    { customer: { name: { contains: normalized, mode: "insensitive" } } },
    { customerOrderNumber: { contains: normalized, mode: "insensitive" } },
    { receivingCompany: { contains: normalized, mode: "insensitive" } },
    { notes: { contains: normalized, mode: "insensitive" } },
  ];

  if (Number.isInteger(parsedOrderNumber) && parsedOrderNumber > 0) {
    or.push({ orderNumber: parsedOrderNumber });
  }

  where.OR = or;
  return where;
}

export default async function PedidosPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const query = (searchParams.q ?? "").trim();
  const requestedPage = parsePage(searchParams.page);
  const where = buildWhere(session.user.id, query);

  const totalFiltered = await prisma.order.count({ where });

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      customer: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return (
    <OrdersPageClient
      orders={orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        itemsCount: order._count.items,
      }))}
      query={query}
      pagination={{
        currentPage,
        pageSize: PAGE_SIZE,
        totalItems: totalFiltered,
        totalPages,
      }}
    />
  );
}
