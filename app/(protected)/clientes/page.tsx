import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { CustomersPageClient } from "@/components/clientes/customers-page-client";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  segment?: string;
}>;

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
  const segment = getSegment(searchParams.segment);
  const where = buildWhere(session.user.id, query, segment);

  const [customers, total, customersCount, prospectsCount] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        _count: {
          select: {
            orders: true,
            crmNotes: true,
            contacts: true,
          },
        },
      },
    }),
    prisma.customer.count({ where: { userId: session.user.id } }),
    prisma.customer.count({ where: { userId: session.user.id, isProspect: false } }),
    prisma.customer.count({ where: { userId: session.user.id, isProspect: true } }),
  ]);

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
      stats={{
        total,
        customers: customersCount,
        prospects: prospectsCount,
      }}
      query={query}
      segment={segment}
    />
  );
}
