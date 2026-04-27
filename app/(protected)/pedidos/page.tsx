import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { OrdersPageClient } from "@/components/pedidos/orders-page-client";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  open?: string;
  q?: string;
  page?: string;
  pageSize?: string;
}>;

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

  const openNewOrder = searchParams.open === "new-order";
  const query = (searchParams.q ?? "").trim();
  const requestedPage = parsePage(searchParams.page);
  const pageSize = parsePageSize(searchParams.pageSize);
  const where = buildWhere(session.user.id, query);

  const totalFiltered = await prisma.order.count({ where });

  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          companyName: true,
        },
      },
      carrier: {
        select: {
          id: true,
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

  const carriers = await prisma.carrier.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [{ name: "asc" }, { updatedAt: "desc" }, { id: "desc" }],
    take: 100,
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <OrdersPageClient
      openNewOrder={openNewOrder}
      orders={orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customer.id,
        customerName: order.customer.name,
        customerCompany: order.customer.companyName,
        carrierId: order.carrier?.id ?? null,
        carrierName: order.carrier?.name ?? null,
        operation: order.operation,
        status: order.status,
        paymentTerm: order.paymentTerm,
        receivingCompany: order.receivingCompany,
        freightType: order.freightType,
        deliveryType: order.deliveryType,
        notes: order.notes,
        customerOrderNumber: order.customerOrderNumber,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        itemsCount: order._count.items,
      }))}
      carriers={carriers}
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
