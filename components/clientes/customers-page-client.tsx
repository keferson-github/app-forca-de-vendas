"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, MoreHorizontal, Search, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { CustomerDeleteSheet } from "@/components/clientes/customer-delete-sheet";
import { CustomerDetailSheet } from "@/components/clientes/customer-detail-sheet";
import {
  CustomerFormSheet,
  type CustomerListItem,
} from "@/components/clientes/customer-form-sheet";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CustomersPageClientProps = {
  customers: CustomerListItem[];
  stats: {
    total: number;
    customers: number;
    prospects: number;
  };
  query: string;
  segment: "all" | "customers" | "prospects";
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
  stats,
  query,
  segment,
}: CustomersPageClientProps) {
  const searchParams = useSearchParams();
  const lastNotice = useRef<string | null>(null);

  useEffect(() => {
    const notice = searchParams.get("notice");

    if (!notice || lastNotice.current === notice) {
      return;
    }

    lastNotice.current = notice;
    const message = noticeMessages[notice];
    if (message) {
      toast.success(message);
    }
  }, [searchParams]);

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
          <CustomerFormSheet
            defaultIsProspect
            triggerLabel="Novo prospect"
            title="Novo prospect"
            description="Registre uma oportunidade antes da conversao em cliente."
            variant="outline"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-transparent shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4" />
              Total cadastrado
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-transparent shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="size-4" />
              Clientes
            </CardDescription>
            <CardTitle className="text-3xl">{stats.customers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-transparent shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UserRoundCheck className="size-4" />
              Prospects
            </CardDescription>
            <CardTitle className="text-3xl">{stats.prospects}</CardTitle>
          </CardHeader>
        </Card>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
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
                          <Badge variant="secondary">
                            {statusLabels[customer.prospectStatus]}
                          </Badge>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
