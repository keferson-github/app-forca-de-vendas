"use client";

import { MoreHorizontal, Search } from "lucide-react";
import { CustomerDeleteSheet } from "@/components/clientes/customer-delete-sheet";
import { CustomerDetailSheet } from "@/components/clientes/customer-detail-sheet";
import {
  CustomerFormSheet,
  type CustomerListItem,
} from "@/components/clientes/customer-form-sheet";
import { DataTable } from "@/components/shared/data-table";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import { useNoticeToast } from "@/hooks/use-notice-toast";

type CustomersPageClientProps = {
  customers: CustomerListItem[];
  query: string;
  segment: "all" | "customers" | "prospects";
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

const noticeMessages: Record<string, string> = {
  "customer-created": "Cliente cadastrado com sucesso.",
  "prospect-created": "Prospect cadastrado com sucesso.",
  "customer-updated": "Cadastro atualizado com sucesso.",
  "customer-deleted": "Cadastro excluido com sucesso.",
};

const statusLabels = {
  PROSPECT: "Prospect",
  QUALIFIED: "Qualificado",
  DISQUALIFIED: "Desqualificado",
  CONVERTED: "Convertido",
};

function EmptyState() {
  return (
    <div className="grid min-h-[280px] place-items-center px-4 py-12 text-center">
      <div>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Nenhum cliente encontrado</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Ajuste a busca ou cadastre um novo cliente/prospect para iniciar o CRM.
        </p>
      </div>
    </div>
  );
}

function SegmentLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button asChild variant={active ? "default" : "outline"} size="sm">
      <a href={href}>{children}</a>
    </Button>
  );
}

export function CustomersPageClient({
  customers,
  query,
  segment,
  pagination,
}: CustomersPageClientProps) {
  useNoticeToast(noticeMessages);

  const queryParam = query ? `&q=${encodeURIComponent(query)}` : "";

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Cadastre clientes e prospects, consulte dados comerciais e mantenha a base pronta
            para pedidos e CRM.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CustomerFormSheet
            triggerLabel="Novo cliente"
            title="Novo cliente"
            description="Cadastre uma empresa ou pessoa que ja faz parte da carteira."
          />
        </div>
      </div>

      <Card className="border-transparent shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <CardTitle>Base comercial</CardTitle>
              <CardDescription>
                Busque por nome, empresa, numero, CNPJ/CPF ou telefone.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <SegmentLink href={`/clientes?q=${encodeURIComponent(query)}`} active={segment === "all"}>
                Todos
              </SegmentLink>
              <SegmentLink href={`/clientes?segment=customers${queryParam}`} active={segment === "customers"}>
                Clientes
              </SegmentLink>
              <SegmentLink href={`/clientes?segment=prospects${queryParam}`} active={segment === "prospects"}>
                Prospects
              </SegmentLink>
            </div>
          </div>

          <form action="/clientes" className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="segment" value={segment} />
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Buscar cliente"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <DataTable
                columns={[
                  { id: "customer", label: "Cliente" },
                  { id: "number", label: "Numero" },
                  { id: "contact", label: "Contato" },
                  { id: "status", label: "Status" },
                  { id: "actions", label: "Acoes", className: "text-right" },
                ]}
                data={customers}
                getRowKey={(customer) => customer.id}
                renderRow={(customer) => (
                  <>
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {customer.companyName || customer.cnpjCpf || "Sem empresa informada"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{customer.customerCode || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={customer.isProspect ? "outline" : "default"}>
                          {customer.isProspect ? "Prospect" : "Cliente"}
                        </Badge>
                        {customer.isProspect ? (
                          <Badge variant="secondary">{statusLabels[customer.prospectStatus]}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <CustomerDetailSheet customer={customer} />
                        <CustomerFormSheet
                          customer={customer}
                          triggerLabel="Editar"
                          title="Editar cadastro"
                          description="Atualize dados cadastrais, contato, enderecos e status."
                          variant="ghost"
                          size="sm"
                        />
                        <CustomerDeleteSheet id={customer.id} name={customer.name} />
                        <Button variant="ghost" size="icon-sm" className="hidden" aria-hidden>
                          <MoreHorizontal />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              />

              <TablePagination
                basePath="/clientes"
                pageSize={pagination.pageSize}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                currentItemsCount={customers.length}
                params={{
                  q: query || undefined,
                  segment: segment === "all" ? undefined : segment,
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
