import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { ProductsPageClient } from "@/components/produtos/products-page-client";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  page?: string;
  pageSize?: string;
}>;

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

function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("Can't reach database server")
    || error.message.includes("Error in PostgreSQL connection");
}

export default async function ProdutosPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const requestedPage = parsePage(searchParams.page);
  const pageSize = parsePageSize(searchParams.pageSize);
  const query = (searchParams.q ?? "").trim();
  const where = buildWhere(session.user.id, query);

  try {
    const totalFiltered = await prisma.product.count({ where });

    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const currentPage = Math.min(requestedPage, totalPages);

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
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
          category: product.category,
          subcategory: product.subcategory,
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
          pageSize,
          totalItems: totalFiltered,
          totalPages,
        }}
      />
    );
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    return (
      <SectionPlaceholder
        title="Produtos temporariamente indisponíveis"
        description="Não foi possível conectar ao banco de dados agora. Tente novamente em alguns instantes."
      />
    );
  }
}
