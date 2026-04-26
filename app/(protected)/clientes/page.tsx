import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { CustomersPageClient } from "@/components/clientes/customers-page-client";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  open?: string;
  q?: string;
  segment?: string;
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

function getSegment(segment?: string): "all" | "customers" | "prospects" {
  if (segment === "customers" || segment === "prospects") {
    return segment;
  }

  return "all";
}

function buildWhere(userId: string, query: string, segment: "all" | "customers" | "prospects") {
  const where: Prisma.CustomerWhereInput = {
    userId,
  };

  if (segment === "customers") {
    where.isProspect = false;
  }

  if (segment === "prospects") {
    where.isProspect = true;
  }

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { companyName: { contains: query, mode: "insensitive" } },
      { cnpjCpf: { contains: query, mode: "insensitive" } },
      { customerCode: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
    ];
  }

  return where;
}

export default async function ClientesPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const query = (searchParams.q ?? "").trim();
  const openNewCustomer = searchParams.open === "new-customer";
  const segment = getSegment(searchParams.segment);
  const requestedPage = parsePage(searchParams.page);
  const where = buildWhere(session.user.id, query, segment);

  const totalFiltered = await prisma.customer.count({ where });

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      _count: {
        select: {
          orders: true,
          crmNotes: true,
          contacts: true,
        },
      },
    },
  });

  return (
    <CustomersPageClient
      customers={customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        companyName: customer.companyName,
        cnpjCpf: customer.cnpjCpf,
        customerCode: customer.customerCode,
        phone: customer.phone,
        commercialAddress: customer.commercialAddress,
        deliveryAddress: customer.deliveryAddress,
        isProspect: customer.isProspect,
        prospectStatus: customer.prospectStatus,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        counts: {
          orders: customer._count.orders,
          crmNotes: customer._count.crmNotes,
          contacts: customer._count.contacts,
        },
      }))}
      openNewCustomer={openNewCustomer}
      query={query}
      segment={segment}
      pagination={{
        currentPage,
        pageSize: PAGE_SIZE,
        totalItems: totalFiltered,
        totalPages,
      }}
    />
  );
}
