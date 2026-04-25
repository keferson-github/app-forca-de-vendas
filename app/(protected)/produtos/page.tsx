import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { ProductsPageClient } from "@/components/produtos/products-page-client";
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
  const where: Prisma.ProductWhereInput = {
    userId,
  };

  if (query) {
    const normalized = query.trim();
    const or: Prisma.ProductWhereInput[] = [
      { code: { startsWith: normalized, mode: "insensitive" } },
      { name: { startsWith: normalized, mode: "insensitive" } },
    ];

    if (normalized.length >= 3) {
      or.push(
        { code: { contains: normalized, mode: "insensitive" } },
        { name: { contains: normalized, mode: "insensitive" } },
        { description: { contains: normalized, mode: "insensitive" } }
      );
    }

    where.OR = or;
  }

  return where;
}

export default async function ProdutosPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const requestedPage = parsePage(searchParams.page);
  const query = (searchParams.q ?? "").trim();
  const where = buildWhere(session.user.id, query);

  const totalFiltered = await prisma.product.count({ where });

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      _count: {
        select: {
          orderItems: true,
        },
      },
    },
  });

  return (
    <ProductsPageClient
      products={products.map((product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl,
        description: product.description,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        itemsCount: product._count.orderItems,
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
