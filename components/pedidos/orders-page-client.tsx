"use client";

import { Search } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { GlobalSearchForm } from "@/components/shared/global-search-form";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableCell } from "@/components/ui/table";

export type OrderListItem = {
  id: string;
  orderNumber: number;
  customerName: string;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  total: number;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
};

type OrdersPageClientProps = {
  orders: OrderListItem[];
  query: string;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

const statusLabels: Record<OrderListItem["status"], string> = {
  DRAFT: "Rascunho",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
};

const statusVariants: Record<OrderListItem["status"], "outline" | "default" | "destructive"> = {
  DRAFT: "outline",
  CONFIRMED: "default",
  CANCELLED: "destructive",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function EmptyState() {
  return (
    <div className="grid min-h-[280px] place-items-center px-4 py-12 text-center">
      <div>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Nenhum pedido encontrado</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Ajuste a busca para localizar pedidos pelo numero, cliente ou observacoes.
        </p>
      </div>
    </div>
  );
}

export function OrdersPageClient({ orders, query, pagination }: OrdersPageClientProps) {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Consulte pedidos confirmados, cancelados e rascunhos com filtros comerciais.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Lista de pedidos</CardTitle>
            <CardDescription>Busque por numero, cliente, empresa recebedora e observacoes.</CardDescription>
          </div>

          <GlobalSearchForm
            actionPath="/pedidos"
            query={query}
            placeholder="Buscar pedido"
          />
        </CardHeader>

        <CardContent>
          {orders.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <DataTable
                columns={[
                  { id: "order", label: "Pedido" },
                  { id: "customer", label: "Cliente" },
                  { id: "status", label: "Status" },
                  { id: "items", label: "Itens", className: "text-center" },
                  { id: "total", label: "Total", className: "text-right" },
                ]}
                data={orders}
                getRowKey={(order) => order.id}
                renderRow={(order) => (
                  <>
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="font-medium">#{order.orderNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          Atualizado em {new Date(order.updatedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{order.itemsCount}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                  </>
                )}
              />

              <TablePagination
                basePath="/pedidos"
                pageSize={pagination.pageSize}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                currentItemsCount={orders.length}
                params={{ q: query || undefined }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
