"use client";

import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TablePaginationProps = {
  basePath: string;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  currentItemsCount: number;
  params?: Record<string, string | undefined>;
  pageSizeOptions?: number[];
  pageSizeParamKey?: string;
};

function buildHref(
  basePath: string,
  page: number,
  params?: Record<string, string | undefined>
) {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  if (page > 1) {
    query.set("page", String(page));
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);

  if (startPage > 2) {
    items.push("ellipsis");
  }

  for (let page = startPage; page <= endPage; page += 1) {
    items.push(page);
  }

  if (endPage < totalPages - 1) {
    items.push("ellipsis");
  }

  items.push(totalPages);
  return items;
}

export function TablePagination({
  basePath,
  pageSize,
  currentPage,
  totalPages,
  totalItems,
  currentItemsCount,
  params,
  pageSizeOptions,
  pageSizeParamKey = "pageSize",
}: TablePaginationProps) {
  const router = useRouter();
  const hasPagination = totalPages > 1;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const paginationItems = hasPagination ? getPaginationItems(currentPage, totalPages) : [];
  const previousHref = buildHref(basePath, Math.max(1, currentPage - 1), params);
  const nextHref = buildHref(basePath, Math.min(totalPages, currentPage + 1), params);
  const firstVisibleItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleItem = totalItems === 0 ? 0 : firstVisibleItem + currentItemsCount - 1;
  const showPageSizeSelector = Boolean(pageSizeOptions?.length);

  const handlePageSizeChange = (value: string) => {
    const nextParams = { ...params, [pageSizeParamKey]: value };
    router.push(buildHref(basePath, 1, nextParams));
  };

  return (
    <div className="mt-6 grid gap-3 rounded-2xl bg-muted/30 px-4 py-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Mostrando {firstVisibleItem}-{lastVisibleItem} de {totalItems} item(ns)
        </p>
        {showPageSizeSelector ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Itens por pagina</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[110px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {pageSizeOptions?.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} itens
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {hasPagination ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={previousHref}
                aria-disabled={!hasPreviousPage}
                className={hasPreviousPage ? undefined : "pointer-events-none opacity-50"}
              />
            </PaginationItem>

            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href={buildHref(basePath, item, params)}
                    isActive={item === currentPage}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href={nextHref}
                aria-disabled={!hasNextPage}
                className={hasNextPage ? undefined : "pointer-events-none opacity-50"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
