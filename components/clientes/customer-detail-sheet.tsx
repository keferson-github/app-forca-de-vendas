"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CustomerListItem } from "@/components/clientes/customer-form-sheet";

type CustomerDetailSheetProps = {
  customer: CustomerListItem;
};

const statusLabels = {
  PROSPECT: "Prospect",
  QUALIFIED: "Qualificado",
  DISQUALIFIED: "Desqualificado",
  CONVERTED: "Convertido",
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || "Nao informado"}</dd>
    </div>
  );
}

export function CustomerDetailSheet({ customer }: CustomerDetailSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Ver ${customer.name}`}>
          <Eye />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant={customer.isProspect ? "outline" : "default"}>
              {customer.isProspect ? "Prospect" : "Cliente"}
            </Badge>
            <Badge variant="secondary">{statusLabels[customer.prospectStatus]}</Badge>
          </div>
          <SheetTitle>{customer.name}</SheetTitle>
          <SheetDescription>
            Informacoes comerciais, contato e enderecos vinculados ao cadastro.
          </SheetDescription>
        </SheetHeader>
        <dl className="grid gap-3 px-4 pb-6">
          <DetailRow label="Nome da empresa" value={customer.companyName} />
          <DetailRow label="CNPJ/CPF" value={customer.cnpjCpf} />
          <DetailRow label="Numero do cliente" value={customer.customerCode} />
          <DetailRow label="Contato" value={customer.phone} />
          <DetailRow label="Endereco comercial" value={customer.commercialAddress} />
          <DetailRow label="Endereco de entrega" value={customer.deliveryAddress} />
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow label="Pedidos" value={String(customer.counts.orders)} />
            <DetailRow label="Anotacoes CRM" value={String(customer.counts.crmNotes)} />
            <DetailRow label="Contatos extras" value={String(customer.counts.contacts)} />
          </div>
        </dl>
      </SheetContent>
    </Sheet>
  );
}
