"use client";

import { useActionState, useRef, useState } from "react";
import { Eye, Pencil, Plus, Search, ShoppingCart } from "lucide-react";
import {
  createOrderAction,
  updateOrderAction,
  type OrderFormState,
} from "@/app/(protected)/pedidos/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { DataTable } from "@/components/shared/data-table";
import { GlobalSearchForm } from "@/components/shared/global-search-form";
import { SearchInputWithAutocomplete } from "@/components/shared/global-search-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNoticeToast } from "@/hooks/use-notice-toast";
import { useSheetSlideGsap } from "@/hooks/use-sheet-slide-gsap";

type OrderAutocompleteCustomer = {
  id: string;
  name: string;
  companyName: string | null;
  customerCode: string | null;
  phone: string | null;
};

export type CarrierOption = {
  id: string;
  name: string;
};

export type OrderListItem = {
  id: string;
  orderNumber: number;
  customerId: string;
  customerName: string;
  customerCompany: string | null;
  carrierId: string | null;
  carrierName: string | null;
  operation: "VENDA";
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  paymentTerm:
    | "DAYS_14"
    | "DAYS_15_30_45"
    | "DAYS_21"
    | "DAYS_21_28"
    | "DAYS_21_28_35"
    | "DAYS_28"
    | "DAYS_30"
    | "DAYS_7"
    | "DAYS_7_14_21"
    | "DAYS_7_14_21_28"
    | "A_VISTA_ANTECIPADA"
    | "BONIFICACAO"
    | "CARTAO_CREDITO"
    | "CARTAO_DEBITO"
    | "TROCA";
  receivingCompany: string | null;
  freightType: "CIF" | "FOB";
  deliveryType: "ENTREGA" | "ENTREGA_FATURA" | "ENCOMENDA" | "RETIRADA";
  notes: string | null;
  customerOrderNumber: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
};

type OrdersPageClientProps = {
  openNewOrder: boolean;
  orders: OrderListItem[];
  carriers: CarrierOption[];
  query: string;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

type OrderFormSheetProps = {
  carriers: CarrierOption[];
  order?: OrderListItem;
  initialOpen?: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon-sm";
  trigger?: React.ReactNode;
};

type CustomerLookupFieldProps = {
  inputId: string;
  selectedCustomer: OrderAutocompleteCustomer | null;
  onSelect: (customer: OrderAutocompleteCustomer | null) => void;
};

const initialState: OrderFormState = {};
const UNASSIGNED_CARRIER_VALUE = "__none__";

const noticeMessages = {
  "order-created": {
    message: "Pedido registrado com sucesso.",
    preset: "success-celebration" as const,
  },
  "order-updated": {
    message: "Pedido atualizado com sucesso.",
    preset: "success-celebration" as const,
  },
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

const paymentTermLabels: Record<OrderListItem["paymentTerm"], string> = {
  DAYS_14: "14 dias",
  DAYS_15_30_45: "15/30/45 dias",
  DAYS_21: "21 dias",
  DAYS_21_28: "21/28 dias",
  DAYS_21_28_35: "21/28/35 dias",
  DAYS_28: "28 dias",
  DAYS_30: "30 dias",
  DAYS_7: "7 dias",
  DAYS_7_14_21: "7/14/21 dias",
  DAYS_7_14_21_28: "7/14/21/28 dias",
  A_VISTA_ANTECIPADA: "À vista antecipada",
  BONIFICACAO: "Bonificação",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  TROCA: "Troca",
};

const freightTypeLabels: Record<OrderListItem["freightType"], string> = {
  CIF: "Frete CIF",
  FOB: "Frete FOB",
};

const deliveryTypeLabels: Record<OrderListItem["deliveryType"], string> = {
  ENTREGA: "Entrega",
  ENTREGA_FATURA: "Ent. fatura",
  ENCOMENDA: "Encomenda",
  RETIRADA: "Retirada",
};

function parseCustomerAutocompletePayload(payload: unknown): OrderAutocompleteCustomer[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const { items } = payload as { items?: unknown };

  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item): item is OrderAutocompleteCustomer => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const typedItem = item as Record<string, unknown>;

    return (
      typeof typedItem.id === "string"
      && typeof typedItem.name === "string"
      && (typedItem.companyName === null || typeof typedItem.companyName === "string")
      && (typedItem.customerCode === null || typeof typedItem.customerCode === "string")
      && (typedItem.phone === null || typeof typedItem.phone === "string")
    );
  });
}

function getCustomerSearchLabel(customer: OrderAutocompleteCustomer) {
  if (!customer.companyName) {
    return customer.name;
  }

  return `${customer.name} - ${customer.companyName}`;
}

function getCustomerCompanyLabel(customer: OrderAutocompleteCustomer) {
  if (!customer.companyName) {
    return "Empresa não informada";
  }

  return customer.companyName;
}

function buildOrderCustomer(order?: OrderListItem): OrderAutocompleteCustomer | null {
  if (!order) {
    return null;
  }

  return {
    id: order.customerId,
    name: order.customerName,
    companyName: order.customerCompany,
    customerCode: null,
    phone: null,
  };
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || "Não informado"}</dd>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function CustomerLookupField({ inputId, selectedCustomer, onSelect }: CustomerLookupFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>Cliente</Label>
      <input type="hidden" name="customerId" value={selectedCustomer?.id ?? ""} />
      <SearchInputWithAutocomplete
        query={selectedCustomer ? getCustomerSearchLabel(selectedCustomer) : ""}
        placeholder="Buscar cliente por nome, empresa ou número"
        minChars={1}
        autocomplete={{
          endpoint: "/api/clientes/autocomplete",
          loadingLabel: "Buscando clientes...",
          emptyLabel: "Nenhum cliente encontrado para essa busca.",
          getItemsFromPayload: parseCustomerAutocompletePayload,
          getItemId: (item) => item.id,
          getItemValue: getCustomerSearchLabel,
          renderItem: (item) => (
            <>
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {getCustomerCompanyLabel(item)}
              </span>
            </>
          ),
        }}
        inputProps={{
          id: inputId,
          required: true,
        }}
        onValueChange={() => {
          onSelect(null);
        }}
        onAutocompleteSelect={onSelect}
      />
      <p className="text-xs text-muted-foreground">
        Digite ao menos 1 caractere e selecione o cliente na lista.
      </p>
    </div>
  );
}

function OrderFormSheet({
  carriers,
  order,
  initialOpen = false,
  triggerLabel,
  title,
  description,
  variant = "default",
  size = "default",
  trigger,
}: OrderFormSheetProps) {
  const action = order ? updateOrderAction : createOrderAction;
  const [state, formAction] = useActionState(action, initialState);
  const { open, onOpenChange, contentRef } = useSheetSlideGsap(initialOpen);
  const formRef = useRef<HTMLFormElement | null>(null);
  const values = state.values;
  const initialCustomer = buildOrderCustomer(order);
  const [selectedCustomer, setSelectedCustomer] = useState<OrderAutocompleteCustomer | null>(initialCustomer);
  const [customerLookupVersion, setCustomerLookupVersion] = useState(0);
  const [selectedCarrierId, setSelectedCarrierId] = useState(values?.carrierId ?? order?.carrierId ?? "");
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState<OrderListItem["paymentTerm"]>(
    values?.paymentTerm ?? order?.paymentTerm ?? "DAYS_28",
  );
  const [selectedFreightType, setSelectedFreightType] = useState<OrderListItem["freightType"]>(
    values?.freightType ?? order?.freightType ?? "CIF",
  );
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<OrderListItem["deliveryType"]>(
    values?.deliveryType ?? order?.deliveryType ?? "ENTREGA",
  );

  function handleReset() {
    formRef.current?.reset();
    setSelectedCustomer(initialCustomer);
    setCustomerLookupVersion((current) => current + 1);
    setSelectedCarrierId(order?.carrierId ?? "");
    setSelectedPaymentTerm(order?.paymentTerm ?? "DAYS_28");
    setSelectedFreightType(order?.freightType ?? "CIF");
    setSelectedDeliveryType(order?.deliveryType ?? "ENTREGA");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant={variant} size={size}>
            {order ? <Pencil /> : <Plus />}
            {triggerLabel}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        ref={contentRef}
        className="w-full overflow-y-auto data-[state=open]:animate-none sm:max-w-2xl"
      >
        <form ref={formRef} action={formAction} className="flex min-h-full flex-col">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-5 px-4 pb-4">
            {order ? <input type="hidden" name="id" value={values?.id || order.id} /> : null}
            <input type="hidden" name="operation" value="VENDA" />
            <input type="hidden" name="carrierId" value={selectedCarrierId} />
            <input type="hidden" name="paymentTerm" value={selectedPaymentTerm} />
            <input type="hidden" name="freightType" value={selectedFreightType} />
            <input type="hidden" name="deliveryType" value={selectedDeliveryType} />

            <CustomerLookupField
              key={`${order?.id ?? "new"}-${customerLookupVersion}`}
              inputId={`${order?.id ?? "new"}-customerId`}
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${order?.id ?? "new"}-carrierId`}>Transportadora</Label>
                <Select
                  value={selectedCarrierId || UNASSIGNED_CARRIER_VALUE}
                  onValueChange={(value) => {
                    setSelectedCarrierId(value === UNASSIGNED_CARRIER_VALUE ? "" : value);
                  }}
                >
                  <SelectTrigger id={`${order?.id ?? "new"}-carrierId`} className="w-full">
                    <SelectValue placeholder="Selecione a transportadora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_CARRIER_VALUE}>Sem transportadora</SelectItem>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${order?.id ?? "new"}-operation`}>Operação</Label>
                <Input
                  id={`${order?.id ?? "new"}-operation`}
                  value="Venda"
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${order?.id ?? "new"}-paymentTerm`}>Condição de pagamento</Label>
              <Select
                value={selectedPaymentTerm}
                onValueChange={(value) => {
                  setSelectedPaymentTerm(value as OrderListItem["paymentTerm"]);
                }}
              >
                <SelectTrigger id={`${order?.id ?? "new"}-paymentTerm`} className="w-full">
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentTermLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${order?.id ?? "new"}-receivingCompany`}>
                Empresa que recebe o pedido
              </Label>
              <Input
                id={`${order?.id ?? "new"}-receivingCompany`}
                name="receivingCompany"
                defaultValue={values?.receivingCompany ?? order?.receivingCompany ?? ""}
                placeholder="Empresa recebedora"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
              <div className="grid gap-2">
                <Label>Frete</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  className="grid w-full grid-cols-2 lg:max-w-sm"
                  value={selectedFreightType}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedFreightType(value as OrderListItem["freightType"]);
                    }
                  }}
                >
                  {Object.entries(freightTypeLabels).map(([value, label]) => (
                    <ToggleGroupItem key={value} value={value} className="w-full justify-center">
                      {label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="grid gap-2">
                <Label>Entrega</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  className="grid w-full grid-cols-2 gap-1.5 lg:grid-cols-4"
                  value={selectedDeliveryType}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedDeliveryType(value as OrderListItem["deliveryType"]);
                    }
                  }}
                >
                  {Object.entries(deliveryTypeLabels).map(([value, label]) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      className="w-full justify-center px-3 text-center leading-tight lg:min-h-9"
                    >
                      {label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${order?.id ?? "new"}-customerOrderNumber`}>
                  Nº do pedido do cliente
                </Label>
                <Input
                  id={`${order?.id ?? "new"}-customerOrderNumber`}
                  name="customerOrderNumber"
                  defaultValue={values?.customerOrderNumber ?? order?.customerOrderNumber ?? ""}
                  placeholder="Número informado pelo cliente"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${order?.id ?? "new"}-status-view`}>Status atual</Label>
                <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm">
                  <Badge variant={order ? statusVariants[order.status] : "default"}>
                    {order ? statusLabels[order.status] : "Confirmado"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${order?.id ?? "new"}-notes`}>Observação</Label>
              <Textarea
                id={`${order?.id ?? "new"}-notes`}
                name="notes"
                defaultValue={values?.notes ?? order?.notes ?? ""}
                placeholder="Observações do pedido, entrega ou faturamento"
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
              <Button type="button" variant="outline" onClick={handleReset}>
                Limpar
              </Button>
              <SubmitButton className="sm:w-auto">
                {order ? "Salvar alterações" : "Salvar pedido"}
              </SubmitButton>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function OrderDetailSheet({ order }: { order: OrderListItem }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Ver pedido ${order.orderNumber}`}>
          <Eye />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">#{order.orderNumber}</Badge>
            <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
          </div>
          <SheetTitle>{order.customerName}</SheetTitle>
          <SheetDescription>
            Resumo comercial do pedido e dos dados operacionais cadastrados.
          </SheetDescription>
        </SheetHeader>
        <dl className="grid gap-3 px-4 pb-6">
          <DetailRow label="Empresa do cliente" value={order.customerCompany} />
          <DetailRow label="Transportadora" value={order.carrierName} />
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Operação" value="Venda" />
            <DetailRow label="Condição de pagamento" value={paymentTermLabels[order.paymentTerm]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Frete" value={freightTypeLabels[order.freightType]} />
            <DetailRow label="Entrega" value={deliveryTypeLabels[order.deliveryType]} />
          </div>
          <DetailRow label="Empresa que recebe" value={order.receivingCompany} />
          <DetailRow label="Nº do pedido do cliente" value={order.customerOrderNumber} />
          <DetailRow label="Observação" value={order.notes} />
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow label="Itens" value={String(order.itemsCount)} />
            <DetailRow label="Total" value={formatCurrency(order.total)} />
            <DetailRow label="Atualizado em" value={formatDate(order.updatedAt)} />
          </div>
        </dl>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-[280px] place-items-center px-4 py-12 text-center">
      <div>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Não foram encontrados pedidos</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Tente refazer a busca clicando no ícone acima ou registre um novo pedido.
        </p>
      </div>
    </div>
  );
}

export function OrdersPageClient({
  openNewOrder,
  orders,
  carriers,
  query,
  pagination,
}: OrdersPageClientProps) {
  useNoticeToast(noticeMessages);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 md:pb-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Registre e acompanhe pedidos comerciais com dados de cliente, frete e faturamento.
          </p>
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          <OrderFormSheet
            key={openNewOrder ? "new-order-open" : "new-order-closed"}
            carriers={carriers}
            initialOpen={openNewOrder}
            triggerLabel="Novo pedido"
            title="Novo pedido"
            description="Preencha os dados comerciais do pedido para registrar a operação."
          />
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Lista de pedidos</CardTitle>
            <CardDescription>Busque por número, cliente, empresa recebedora e observações.</CardDescription>
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
                hideOnMobile={false}
                columns={[
                  { id: "order", label: "Pedido" },
                  { id: "customer", label: "Cliente" },
                  { id: "status", label: "Status" },
                  { id: "items", label: "Itens", className: "text-center" },
                  { id: "total", label: "Total", className: "text-right" },
                  { id: "actions", label: "Acoes", className: "text-right" },
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
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="font-medium">{order.customerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.receivingCompany || order.customerCompany || "Sem empresa informada"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{order.itemsCount}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <OrderDetailSheet order={order} />
                        <OrderFormSheet
                          carriers={carriers}
                          order={order}
                          triggerLabel="Editar"
                          title={`Editar pedido #${order.orderNumber}`}
                          description="Atualize os dados principais do pedido registrado."
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    </TableCell>
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
        <OrderFormSheet
          key={openNewOrder ? "mobile-new-order-open" : "mobile-new-order-closed"}
          carriers={carriers}
          initialOpen={openNewOrder}
          triggerLabel="Novo pedido"
          title="Novo pedido"
          description="Preencha os dados comerciais do pedido para registrar a operação."
          trigger={
            <MobileFloatingActionButton>
              <ShoppingCart className="size-4" />
              Novo pedido
            </MobileFloatingActionButton>
          }
        />
      </MobileFloatingAction>
    </div>
  );
}
