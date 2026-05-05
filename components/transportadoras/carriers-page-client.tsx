"use client";

import { useActionState } from "react";
import { Eye, Search, Trash2, Truck } from "lucide-react";
import {
  createCarrierAction,
  deleteCarrierAction,
  updateCarrierAction,
  type CarrierFormState,
} from "@/app/(protected)/transportadoras/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { GlobalSearchForm } from "@/components/shared/global-search-form";
import {
  MobileFloatingAction,
  MobileFloatingActionButton,
} from "@/components/shared/mobile-floating-action";
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
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useNoticeToast } from "@/hooks/use-notice-toast";
import { useSheetSlideGsap } from "@/hooks/use-sheet-slide-gsap";

export type CarrierListItem = {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
};

type CarriersPageClientProps = {
  carriers: CarrierListItem[];
  query: string;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

type CarrierFormSheetProps = {
  carrier?: CarrierListItem;
  triggerLabel: string;
  title: string;
  description: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon-sm";
  trigger?: React.ReactNode;
};

const initialState: CarrierFormState = {};

const noticeMessages = {
  "carrier-created": {
    message: "Transportadora cadastrada com sucesso.",
    preset: "success-celebration" as const,
  },
  "carrier-updated": {
    message: "Transportadora atualizada com sucesso.",
    preset: "success-celebration" as const,
  },
  "carrier-deleted": {
    message: "Transportadora excluida com sucesso.",
    preset: "success-celebration" as const,
  },
};

const CARRIERS_FONT_FAMILY =
  '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhone(value: string) {
  let digits = onlyDigits(value);

  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (!digits) {
    return "";
  }

  if (digits.length < 3) {
    return `(${digits}`;
  }

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (digits.length <= 10) {
    const first = rest.slice(0, 4);
    const second = rest.slice(4);
    return second ? `(${ddd}) ${first}-${second}` : `(${ddd}) ${first}`;
  }

  const first = rest.slice(0, 5);
  const second = rest.slice(5);
  return `(${ddd}) ${first}-${second}`;
}

function EmptyState() {
  return (
    <div className="grid min-h-[280px] place-items-center px-4 py-12 text-center">
      <div>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Nenhuma transportadora encontrada</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Ajuste sua busca ou crie um novo cadastro para usar no fluxo de pedidos.
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || "Nao informado"}</dd>
    </div>
  );
}

function CarrierFormSheet({
  carrier,
  triggerLabel,
  title,
  description,
  variant = "default",
  size = "default",
  trigger,
}: CarrierFormSheetProps) {
  const action = carrier ? updateCarrierAction : createCarrierAction;
  const [state, formAction] = useActionState(action, initialState);
  const { open, onOpenChange, contentRef } = useSheetSlideGsap();
  const values = state.values;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant={variant} size={size}>
            <Truck />
            {triggerLabel}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        ref={contentRef}
        className="w-full overflow-y-auto data-[state=open]:animate-none sm:max-w-xl"
      >
        <form action={formAction} className="flex min-h-full flex-col">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4 pb-4">
            {carrier ? <input type="hidden" name="id" value={values?.id || carrier.id} /> : null}

            <div className="grid gap-2">
              <Label htmlFor={`${carrier?.id ?? "new"}-name`}>Nome da transportadora</Label>
              <Input
                id={`${carrier?.id ?? "new"}-name`}
                name="name"
                defaultValue={values?.name ?? carrier?.name ?? ""}
                placeholder="Nome da transportadora"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${carrier?.id ?? "new"}-contact`}>Responsável</Label>
                <Input
                  id={`${carrier?.id ?? "new"}-contact`}
                  name="contact"
                  defaultValue={values?.contact ?? carrier?.contact ?? ""}
                  placeholder="Nome do contato"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${carrier?.id ?? "new"}-phone`}>Telefone</Label>
                <Input
                  id={`${carrier?.id ?? "new"}-phone`}
                  name="phone"
                  defaultValue={values?.phone ?? formatPhone(carrier?.phone ?? "")}
                  placeholder="Telefone principal"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={15}
                  onChange={(event) => {
                    event.currentTarget.value = formatPhone(event.currentTarget.value);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${carrier?.id ?? "new"}-notes`}>Observacoes</Label>
              <Textarea
                id={`${carrier?.id ?? "new"}-notes`}
                name="notes"
                defaultValue={values?.notes ?? carrier?.notes ?? ""}
                placeholder="Instrucoes de coleta, entrega ou observacoes comerciais"
              />
            </div>

            {state.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
          </div>

          <SheetFooter>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="reset" variant="outline">
                Limpar
              </Button>
              <SubmitButton>{carrier ? "Salvar alteracoes" : "Salvar cadastro"}</SubmitButton>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CarrierDetailSheet({ carrier }: { carrier: CarrierListItem }) {
  const { open, onOpenChange, contentRef } = useSheetSlideGsap();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Ver ${carrier.name}`}>
          <Eye />
        </Button>
      </SheetTrigger>
      <SheetContent
        ref={contentRef}
        className="w-full overflow-y-auto data-[state=open]:animate-none sm:max-w-xl"
      >
        <SheetHeader>
          <Badge variant="secondary" className="w-fit">
            {carrier.ordersCount} pedido(s)
          </Badge>
          <SheetTitle>{carrier.name}</SheetTitle>
          <SheetDescription>Dados de contato e observacoes da transportadora.</SheetDescription>
        </SheetHeader>
        <dl className="grid gap-3 px-4 pb-6">
          <DetailRow label="Contato" value={carrier.contact} />
          <DetailRow label="Telefone" value={carrier.phone ? formatPhone(carrier.phone) : null} />
          <DetailRow label="Observacoes" value={carrier.notes} />
        </dl>
      </SheetContent>
    </Sheet>
  );
}

function CarrierDeleteSheet({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmActionDialog
      action={deleteCarrierAction}
      hiddenFields={{ id }}
      title="Excluir transportadora"
      description={
        <>
          Esta ação remove o cadastro de {name}. Cadastros vinculados a pedidos não podem ser
          excluídos.
        </>
      }
      confirmLabel="Confirmar exclusão"
      pendingLabel="Excluindo..."
      confirmVariant="destructive"
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${name}`}>
          <Trash2 />
        </Button>
      }
    />
  );
}

export function CarriersPageClient({ carriers, query, pagination }: CarriersPageClientProps) {
  useNoticeToast(noticeMessages);

  return (
    <div
      className="flex flex-col gap-4 p-4 pb-24 md:pb-4 lg:p-6"
      style={{ fontFamily: CARRIERS_FONT_FAMILY }}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transportadoras</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Mantenha a base de transportadoras atualizada para agilizar a emissao de pedidos.
          </p>
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          <CarrierFormSheet
            triggerLabel="Nova transportadora"
            title="Nova transportadora"
            description="Cadastre os dados basicos da transportadora para uso nos pedidos."
          />
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Base de transportadoras</CardTitle>
            <CardDescription>Busque por nome, contato ou telefone.</CardDescription>
          </div>

          <GlobalSearchForm
            actionPath="/transportadoras"
            query={query}
            placeholder="Buscar transportadora"
          />
        </CardHeader>

        <CardContent>
          {carriers.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carriers.map((carrier) => (
                    <TableRow key={carrier.id}>
                      <TableCell>
                        <div className="grid gap-1">
                          <span className="font-medium">{carrier.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Atualizado em {new Date(carrier.updatedAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{carrier.contact || "-"}</TableCell>
                      <TableCell>{carrier.phone ? formatPhone(carrier.phone) : "-"}</TableCell>
                      <TableCell>{carrier.ordersCount}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <CarrierDetailSheet carrier={carrier} />
                          <CarrierFormSheet
                            key={`edit-${carrier.id}-${carrier.updatedAt}`}
                            carrier={carrier}
                            triggerLabel="Editar"
                            title="Editar transportadora"
                            description="Atualize contato, telefone e observacoes comerciais."
                            variant="ghost"
                            size="sm"
                          />
                          <CarrierDeleteSheet id={carrier.id} name={carrier.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                basePath="/transportadoras"
                pageSize={pagination.pageSize}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                currentItemsCount={carriers.length}
                params={{
                  q: query || undefined,
                  pageSize: String(pagination.pageSize),
                }}
                pageSizeOptions={[10, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>

      <MobileFloatingAction>
        <CarrierFormSheet
          triggerLabel="Nova transportadora"
          title="Nova transportadora"
          description="Cadastre os dados basicos da transportadora para uso nos pedidos."
          trigger={
            <MobileFloatingActionButton>
              <Truck className="size-4" />
              Nova transportadora
            </MobileFloatingActionButton>
          }
        />
      </MobileFloatingAction>
    </div>
  );
}
