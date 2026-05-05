"use client";

import { useActionState, useRef, useState } from "react";
import { CheckCircle2, Eye, MessageCircle, Pencil, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { IconFileTypePdf } from "@tabler/icons-react";
import {
  addOrderItemAction,
  billOrderAction,
  confirmOrderAction,
  createOrderAction,
  deleteOrderItemAction,
  deleteOrderAction,
  type OrderItemFormState,
  type OrderStatusFormState,
  updateOrderAction,
  type OrderFormState,
} from "@/app/(protected)/pedidos/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { OrderPdfTemplate } from "@/components/pedidos/order-pdf-template";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
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
import { appToast } from "@/lib/toast";

type OrderAutocompleteCustomer = {
  id: string;
  name: string;
  companyName: string | null;
  customerCode: string | null;
  phone: string | null;
};

type OrderAutocompleteProduct = {
  id: string;
  code: string;
  name: string;
  price: number;
  stockQuantity: number;
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
  customerCode: string | null;
  customerCnpjCpf: string | null;
  customerPhone: string | null;
  customerCommercialAddress: string | null;
  customerDeliveryAddress: string | null;
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
  approvedAt: string | null;
  billedAt: string | null;
  lastBlingSyncAt: string | null;
  lastBlingError: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string | null;
    productCode: string | null;
    productName: string | null;
    description: string;
    quantity: number;
    discount: number;
    unitPrice: number;
    totalPrice: number;
    operation: "VENDA";
  }>;
  itemsCount: number;
};

type OrdersPageClientProps = {
  openNewOrder: boolean;
  openOrderId?: string | null;
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
const initialItemState: OrderItemFormState = {};
const initialStatusState: OrderStatusFormState = {};
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
  "order-deleted": {
    message: "Pedido excluído com sucesso.",
    preset: "success-celebration" as const,
  },
  "order-item-added": {
    message: "Item adicionado ao pedido.",
    preset: "success-celebration" as const,
  },
  "order-item-updated": {
    message: "Item do pedido atualizado.",
    preset: "success-celebration" as const,
  },
  "order-item-deleted": {
    message: "Item removido do pedido.",
    preset: "success-celebration" as const,
  },
  "order-confirmed": {
    message: "Pedido confirmado e enviado para sincronização com Bling.",
    preset: "success-celebration" as const,
  },
  "order-billed": {
    message: "Pedido faturado com sucesso no Bling.",
    preset: "success-celebration" as const,
  },
};

const statusLabels: Record<OrderListItem["status"], string> = {
  DRAFT: "Rascunho",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
};

const mobileStatusLabels: Record<OrderListItem["status"], string> = {
  DRAFT: "Digitando",
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

function parseProductAutocompletePayload(payload: unknown): OrderAutocompleteProduct[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const { items } = payload as { items?: unknown };

  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item): item is OrderAutocompleteProduct => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const typedItem = item as Record<string, unknown>;

    return (
      typeof typedItem.id === "string"
      && typeof typedItem.code === "string"
      && typeof typedItem.name === "string"
      && typeof typedItem.price === "number"
      && typeof typedItem.stockQuantity === "number"
    );
  });
}

function getCustomerSearchLabel(customer: OrderAutocompleteCustomer) {
  return customer.name;
}

function getCustomerCompanyLabel(customer: OrderAutocompleteCustomer) {
  const normalizedCompany = normalizeOptionalLabel(customer.companyName);

  if (!normalizedCompany) {
    return "Empresa não informada";
  }

  return normalizedCompany;
}

function buildOrderCustomer(order?: OrderListItem): OrderAutocompleteCustomer | null {
  if (!order) {
    return null;
  }

  return {
    id: order.customerId,
    name: normalizeCustomerDisplayName(order.customerName),
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

function getProductSearchLabel(product: OrderAutocompleteProduct) {
  return `${product.code} - ${product.name}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Pendente";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function formatPhoneToWa(value: string | null) {
  if (!value) {
    return null;
  }

  const onlyDigits = value.replace(/\D/g, "");

  if (!onlyDigits) {
    return null;
  }

  if (onlyDigits.startsWith("55")) {
    return onlyDigits;
  }

  return `55${onlyDigits}`;
}

function normalizeCustomerDisplayName(value: string) {
  return value.replace(/\s+(edit|editar)$/i, "").trim();
}

function normalizeOptionalLabel(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+(edit|editar)$/i, "").trim();
  return normalized || null;
}

function getFirstName(value: string) {
  const firstName = normalizeCustomerDisplayName(value).split(/\s+/)[0];
  return firstName || "cliente";
}

function formatMoneyInput(value: number) {
  return value.toFixed(2).replace(".", ",");
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
                  spacing={1}
                  className="grid w-full grid-cols-2 lg:max-w-sm"
                  value={selectedFreightType}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedFreightType(value as OrderListItem["freightType"]);
                    }
                  }}
                >
                  {Object.entries(freightTypeLabels).map(([value, label]) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      className="w-full justify-center data-[state=on]:border-black data-[state=on]:bg-black data-[state=on]:text-white dark:data-[state=on]:border-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-black"
                    >
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
                  spacing={1}
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
                      className="w-full justify-center px-3 text-center leading-tight lg:min-h-9 data-[state=on]:border-black data-[state=on]:bg-black data-[state=on]:text-white dark:data-[state=on]:border-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-black"
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

function OrderDetailSheet({
  order,
  initialOpen = false,
  trigger,
}: {
  order: OrderListItem;
  initialOpen?: boolean;
  trigger?: React.ReactNode;
}) {
  return (
    <Sheet defaultOpen={initialOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon-sm" aria-label={`Adicionar itens ao pedido ${order.orderNumber}`}>
            <Plus />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">#{order.orderNumber}</Badge>
            <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
          </div>
          <SheetTitle>{normalizeCustomerDisplayName(order.customerName)}</SheetTitle>
          <SheetDescription>
            Resumo comercial do pedido e dos dados operacionais cadastrados.
          </SheetDescription>
        </SheetHeader>
        <dl className="grid gap-3 px-4 pb-6">
          <DetailRow label="Empresa do cliente" value={normalizeOptionalLabel(order.customerCompany)} />
          <DetailRow label="Nome do cliente" value={normalizeCustomerDisplayName(order.customerName)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Código do cliente" value={order.customerCode} />
            <DetailRow label="CNPJ/CPF" value={order.customerCnpjCpf} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Telefone do cliente" value={order.customerPhone} />
            <DetailRow label="Nº do pedido do cliente" value={order.customerOrderNumber} />
          </div>
          <DetailRow label="Endereço comercial" value={order.customerCommercialAddress} />
          <DetailRow label="Endereço de entrega" value={order.customerDeliveryAddress} />
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
          <DetailRow label="Observação" value={order.notes} />
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow label="Itens" value={String(order.itemsCount)} />
            <DetailRow label="Total" value={formatCurrency(order.total)} />
            <DetailRow label="Atualizado em" value={formatDate(order.updatedAt)} />
          </div>
        </dl>
        <div className="px-4 pb-6">
          <OrderItemsReadOnlySection order={order} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function OrderEditItemsSheet({
  order,
  trigger,
}: {
  order: OrderListItem;
  trigger?: React.ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon-sm" aria-label={`Itens adicionados do pedido ${order.orderNumber}`}>
            <Pencil />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[44rem]">
        <SheetHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">#{order.orderNumber}</Badge>
            <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
          </div>
          <SheetTitle>Itens adicionados #{order.orderNumber}</SheetTitle>
          <SheetDescription>
            Gerencie itens do pedido com busca de produtos, quantidade e atualização de valores.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <OrderItemsPanel order={order} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function OrderItemsReadOnlySection({ order }: { order: OrderListItem }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-border/60 bg-background p-4">
        <h3 className="text-sm font-semibold">Itens adicionados no pedido</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Lista de itens já vinculados ao pedido do cliente.
        </p>

        {order.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            Nenhum item cadastrado no pedido.
          </p>
        ) : (
          <div className="grid gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-sm font-medium">{item.description || item.productName || "Item do pedido"}</p>
                <p className="text-xs text-muted-foreground">
                  Quantidade: {item.quantity} | Desconto: {item.discount}% | Unitário: {formatCurrency(item.unitPrice)} | Total: {formatCurrency(item.totalPrice)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-background p-4">
        <p className="text-sm font-semibold">Resumo</p>
        <p className="text-xs text-muted-foreground">
          Total atual: {formatCurrency(order.total)} | Itens: {order.itemsCount}
        </p>
      </div>
    </div>
  );
}

function OrderDeleteDialog({ order, compact = false }: { order: OrderListItem; compact?: boolean }) {
  return (
    <ConfirmActionDialog
      action={deleteOrderAction}
      hiddenFields={{ id: order.id }}
      title="Excluir pedido"
      description={
        <>
          Esta ação remove o pedido #{order.orderNumber}. Os itens e documentos vinculados
          também serão removidos.
        </>
      }
      confirmLabel="Confirmar exclusão"
      pendingLabel="Excluindo..."
      confirmVariant="destructive"
      trigger={
        <Button
          variant={compact ? "outline" : "ghost"}
          size="icon-sm"
          aria-label={`Excluir pedido ${order.orderNumber}`}
        >
          <Trash2 />
        </Button>
      }
    />
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
  openOrderId = null,
  orders,
  carriers,
  query,
  pagination,
}: OrdersPageClientProps) {
  useNoticeToast(noticeMessages);
  const pdfTemplateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pdfGeneratingOrderId, setPdfGeneratingOrderId] = useState<string | null>(null);
  const [whatsappSendingOrderId, setWhatsappSendingOrderId] = useState<string | null>(null);

  async function generateOrderPdfBlob(order: OrderListItem) {
    const templateElement = pdfTemplateRefs.current[order.id];

    if (!templateElement) {
      appToast.error("Nao foi possivel carregar o template do pedido para PDF.");
      return null;
    }

    try {
      const [{ default: html2canvas }, jspdfModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(templateElement, {
        backgroundColor: "#ffffff",
        scale: 1.4,
        useCORS: true,
        windowWidth: templateElement.scrollWidth,
        windowHeight: templateElement.scrollHeight,
      });

      const imageData = canvas.toDataURL("image/jpeg", 0.82);
      const pdf = new jspdfModule.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageMargin = 6;
      const maxWidth = pageWidth - (pageMargin * 2);
      const maxHeight = pageHeight - (pageMargin * 2);
      const imageAspectRatio = canvas.width / canvas.height;

      let renderWidth = maxWidth;
      let renderHeight = renderWidth / imageAspectRatio;

      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = renderHeight * imageAspectRatio;
      }

      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      pdf.addImage(imageData, "JPEG", offsetX, offsetY, renderWidth, renderHeight);
      const pdfBlob = pdf.output("blob");

      if (!(pdfBlob instanceof Blob)) {
        throw new Error("Nao foi possivel gerar o arquivo PDF.");
      }

      return pdfBlob;
    } catch (error) {
      console.error("Falha ao gerar PDF do pedido", error);
      throw error;
    }
  }

  async function handleDownloadPdf(order: OrderListItem) {
    setPdfGeneratingOrderId(order.id);
    const loadingToastId = appToast.loading(`Gerando PDF do pedido #${order.orderNumber}...`);

    try {
      const pdfBlob = await generateOrderPdfBlob(order);

      if (!pdfBlob) {
        return;
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `pedido-${order.orderNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(blobUrl);

      appToast.successCelebration(`PDF do pedido #${order.orderNumber} gerado com sucesso.`);
    } catch {
      appToast.error("Nao foi possivel gerar o PDF do pedido.");
    } finally {
      appToast.dismiss(loadingToastId);
      setPdfGeneratingOrderId(null);
    }
  }

  async function handleOpenWhatsapp(order: OrderListItem) {
    const phone = formatPhoneToWa(order.customerPhone);

    if (!phone) {
      appToast.error("Cliente sem telefone valido para WhatsApp.");
      return;
    }

    setWhatsappSendingOrderId(order.id);
    const customerFirstName = getFirstName(order.customerName);
    const loadingToastId = appToast.loading(
      `Enviando pedido via PDF para ${customerFirstName}...`
    );

    try {
      const pdfBlob = await generateOrderPdfBlob(order);

      if (!pdfBlob) {
        return;
      }

      const file = new File(
        [pdfBlob],
        `pedido-${order.orderNumber}.pdf`,
        { type: "application/pdf" },
      );
      const payload = new FormData();
      payload.set("orderId", order.id);
      payload.set("pdfFile", file);

      const response = await fetch("/api/pedidos/whatsapp/send", {
        method: "POST",
        body: payload,
      });

      const result = await response.json().catch(() => ({} as Record<string, unknown>));

      if (!response.ok) {
        const errorMessage = typeof result.error === "string"
          ? result.error
          : "Nao foi possivel enviar o PDF pelo WhatsApp.";
        throw new Error(errorMessage);
      }

      appToast.successCelebration(
        `Pedido #${order.orderNumber} enviado por WhatsApp com sucesso.`
      );
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Nao foi possivel enviar o pedido por WhatsApp.";

      appToast.error(errorMessage);
    } finally {
      appToast.dismiss(loadingToastId);
      setWhatsappSendingOrderId(null);
    }
  }

  function renderCoreOrderActions(order: OrderListItem, compact = false) {
    return (
      <div className={`flex items-center gap-1.5 ${compact ? "justify-between" : "justify-end"}`}>
        <OrderDetailSheet
          order={order}
          initialOpen={openOrderId === order.id && !compact}
          trigger={(
            <Button
              variant={compact ? "outline" : "ghost"}
              size="icon-sm"
              aria-label={`Ver pedido ${order.orderNumber}`}
            >
              <Eye />
            </Button>
          )}
        />
        <OrderEditItemsSheet
          order={order}
          trigger={(
            <Button
              variant={compact ? "outline" : "ghost"}
              size="icon-sm"
              aria-label={`Itens adicionados do pedido ${order.orderNumber}`}
            >
              <Pencil />
            </Button>
          )}
        />
        <OrderBillingAction order={order} compact={compact} />
        <Button
          variant={compact ? "outline" : "ghost"}
          size="icon-sm"
          aria-label={`Gerar PDF do pedido ${order.orderNumber}`}
          disabled={pdfGeneratingOrderId === order.id}
          onClick={() => {
            void handleDownloadPdf(order);
          }}
        >
          <IconFileTypePdf className={`size-4 ${compact ? "text-amber-700" : "text-amber-600"}`} />
        </Button>
        <OrderDeleteDialog order={order} compact={compact} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 md:pb-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Registre pedidos, gere PDF no template comercial e compartilhe rapidamente no WhatsApp.
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
            <CardDescription>
              Estrutura exibida por cliente, emissão, faturamento, despacho e pagamento.
            </CardDescription>
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
              <div className="grid gap-3 md:hidden">
                {orders.map((order) => (
                  <div
                    key={`mobile-order-card-${order.id}`}
                    className="rounded-xl border border-border/80 bg-card p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  >
                    <div className="grid grid-cols-[68px_minmax(0,1fr)] gap-3">
                      <div className="flex items-center justify-center rounded-lg bg-muted/55 text-3xl font-bold tracking-tight text-foreground/90">
                        {order.orderNumber}
                      </div>
                      <div className="grid gap-1.5">
                        <p className="text-base font-semibold leading-tight tracking-tight uppercase">
                          {normalizeCustomerDisplayName(order.customerName)}
                        </p>
                        <p className="text-sm leading-none">
                          <span className="font-medium text-muted-foreground">Código do pedido:</span>{" "}
                          <span className="font-semibold">{order.orderNumber}</span>
                        </p>
                        <p className="text-sm leading-none">
                          <span className="font-medium text-muted-foreground">Total do pedido:</span>{" "}
                          <span className="font-semibold">{formatCurrency(order.total)}</span>
                        </p>
                        <p className="text-sm leading-none">
                          <span className="font-medium text-muted-foreground">Emissão:</span>{" "}
                          <span>{formatDateTime(order.createdAt)}</span>
                        </p>
                        <p className="text-sm leading-none">
                          <span className="font-medium text-muted-foreground">Faturamento:</span>{" "}
                          <span>{formatDateTime(order.billedAt)}</span>
                        </p>
                        <p className="text-sm leading-none">
                          <span className="font-medium text-muted-foreground">Despacho:</span>{" "}
                          <span>{formatDateTime(order.approvedAt)}</span>
                        </p>
                        <p className="text-sm leading-none">
                          <span className="font-medium text-muted-foreground">Pagto.:</span>{" "}
                          <span>{paymentTermLabels[order.paymentTerm]}</span>
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            order.status === "DRAFT" ? "text-destructive" : "text-emerald-700"
                          }`}
                        >
                          {mobileStatusLabels[order.status]}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-border/70 pt-3">
                      {renderCoreOrderActions(order, true)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <DataTable
                  hideOnMobile={false}
                  columns={[
                    { id: "order", label: "Pedido" },
                    { id: "customer", label: "Nome do cliente" },
                    { id: "customerCode", label: "Código do cliente" },
                    { id: "total", label: "Valor total do pedido", className: "text-right" },
                    { id: "issuedAt", label: "Data e hora de emissão" },
                    { id: "billing", label: "Faturamento" },
                    { id: "dispatch", label: "Despacho" },
                    { id: "payment", label: "Pagto." },
                    { id: "actions", label: "Ações", className: "text-right" },
                  ]}
                  data={orders}
                  getRowKey={(order) => order.id}
                  renderRow={(order) => (
                    <>
                      <TableCell>
                        <div className="grid gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{order.orderNumber}</span>
                            {order.billedAt ? <Badge variant="secondary">Faturado</Badge> : null}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {order.itemsCount} item(ns)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{normalizeCustomerDisplayName(order.customerName)}</span>
                      </TableCell>
                      <TableCell>
                        {order.customerCode || "Nao informado"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                      <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(order.billedAt)}</TableCell>
                      <TableCell>{formatDateTime(order.approvedAt)}</TableCell>
                      <TableCell>{paymentTermLabels[order.paymentTerm]}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          {renderCoreOrderActions(order)}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Enviar pedido ${order.orderNumber} por WhatsApp`}
                            disabled={whatsappSendingOrderId === order.id}
                            onClick={() => {
                              void handleOpenWhatsapp(order);
                            }}
                          >
                            <MessageCircle />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                />
              </div>

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

      <div className="pointer-events-none fixed -left-[99999px] top-0 opacity-0" aria-hidden>
        {orders.map((order) => (
          <OrderPdfTemplate
            key={`order-pdf-template-${order.id}`}
            ref={(element) => {
              pdfTemplateRefs.current[order.id] = element;
            }}
            order={order}
            paymentLabel={paymentTermLabels[order.paymentTerm]}
          />
        ))}
      </div>
    </div>
  );
}

function OrderBillingAction({ order, compact = false }: { order: OrderListItem; compact?: boolean }) {
  const [state, formAction] = useActionState(billOrderAction, initialStatusState);
  const canBill = order.status === "CONFIRMED" && !order.billedAt;

  if (order.billedAt) {
    return <Badge variant="secondary">{compact ? "Faturado" : "Faturado"}</Badge>;
  }

  if (!canBill) {
    return (
      <Button variant="outline" size={compact ? "sm" : "sm"} disabled>
        Faturar
      </Button>
    );
  }

  return (
    <form action={formAction} className={`flex ${compact ? "flex-col items-start" : "flex-col items-end"} gap-1`}>
      <input type="hidden" name="orderId" value={order.id} />
      <Button type="submit" variant={state.error ? "destructive" : "outline"} size="sm">
        {state.error ? "Tentar novamente" : "Faturar pedido"}
      </Button>
      {state.error ? (
        <p className={`max-w-52 text-[11px] leading-tight text-destructive ${compact ? "text-left" : "text-right"}`}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function ProductLookupField({
  inputId,
  selectedProduct,
  onSelect,
}: {
  inputId: string;
  selectedProduct: OrderAutocompleteProduct | null;
  onSelect: (product: OrderAutocompleteProduct | null) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>Produtos cadastrados</Label>
      <input type="hidden" name="productId" value={selectedProduct?.id ?? ""} />
      <SearchInputWithAutocomplete
        query={selectedProduct ? getProductSearchLabel(selectedProduct) : ""}
        placeholder="Buscar por código ou nome do produto"
        minChars={1}
        autocomplete={{
          endpoint: "/api/produtos/autocomplete",
          loadingLabel: "Buscando produtos...",
          emptyLabel: "Nenhum produto encontrado para a busca.",
          getItemsFromPayload: parseProductAutocompletePayload,
          getItemId: (item) => item.id,
          getItemValue: getProductSearchLabel,
          renderItem: (item) => (
            <>
              <span className="text-sm font-medium">{getProductSearchLabel(item)}</span>
              <span className="text-xs text-muted-foreground">
                Preço: {formatCurrency(item.price)} | Saldo: {item.stockQuantity}
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
        Digite ao menos 1 caractere e selecione um produto cadastrado na página Produtos.
      </p>
    </div>
  );
}

function OrderItemsPanel({ order }: { order: OrderListItem }) {
  const [selectedProduct, setSelectedProduct] = useState<OrderAutocompleteProduct | null>(null);
  const [lookupVersion, setLookupVersion] = useState(0);
  const [quantityCounter, setQuantityCounter] = useState(1);
  const [discountInput, setDiscountInput] = useState("0");
  const [addState, addItemAction] = useActionState(addOrderItemAction, initialItemState);
  const [confirmState, confirmAction] = useActionState(confirmOrderAction, initialStatusState);
  const hasSelectedProduct = selectedProduct !== null;
  const selectedProductUnitPriceNumber = selectedProduct?.price ?? 0;
  const selectedProductUnitPrice = selectedProduct ? formatMoneyInput(selectedProductUnitPriceNumber) : "";
  const selectedProductTotalPrice = selectedProductUnitPriceNumber * quantityCounter;
  function handleResetAddForm(formElement: HTMLFormElement) {
    formElement.reset();
    setSelectedProduct(null);
    setQuantityCounter(1);
    setDiscountInput("0");
    setLookupVersion((current) => current + 1);
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-border/60 bg-background p-4">
        <h3 className="text-sm font-semibold">Itens do pedido</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Monte o pedido com os produtos cadastrados na página Produtos do app.
        </p>

        {order.status === "DRAFT" ? (
          <form
            action={addItemAction}
            className="grid gap-3"
            onReset={(event) => {
              handleResetAddForm(event.currentTarget);
            }}
          >
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="unitPrice" value={selectedProductUnitPrice} />
            <ProductLookupField
              key={`${order.id}-product-lookup-${lookupVersion}`}
              inputId={`${order.id}-productId`}
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
            />
            <div className="hidden gap-3 lg:grid lg:grid-cols-20 lg:items-end">
              <div className="grid gap-1 lg:col-span-10">
                <Label htmlFor={`${order.id}-quantity-desktop`}>Quantidade</Label>
                <Input
                  id={`${order.id}-quantity-desktop`}
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={quantityCounter}
                  disabled={!hasSelectedProduct}
                  onChange={(event) => {
                    const parsed = Number(event.currentTarget.value);

                    if (!Number.isFinite(parsed)) {
                      setQuantityCounter(1);
                      return;
                    }

                    setQuantityCounter(Math.max(1, Math.trunc(parsed)));
                  }}
                />
              </div>
              <div className="lg:col-span-3 lg:self-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full border-border bg-background text-foreground shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.08)] hover:bg-background hover:shadow-[0_0_0_1px_rgba(15,23,42,0.22),0_4px_10px_rgba(15,23,42,0.12)] dark:bg-input/30 dark:hover:bg-input/30 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_2px_6px_rgba(2,6,23,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(148,163,184,0.5),0_4px_10px_rgba(2,6,23,0.45)]"
                  disabled={!hasSelectedProduct}
                  onClick={() => {
                    setQuantityCounter((current) => Math.max(1, current - 1));
                  }}
                >
                  -
                </Button>
              </div>
              <div className="lg:col-span-3 lg:self-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full border-border bg-background text-foreground shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.08)] hover:bg-background hover:shadow-[0_0_0_1px_rgba(15,23,42,0.22),0_4px_10px_rgba(15,23,42,0.12)] dark:bg-input/30 dark:hover:bg-input/30 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_2px_6px_rgba(2,6,23,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(148,163,184,0.5),0_4px_10px_rgba(2,6,23,0.45)]"
                  disabled={!hasSelectedProduct}
                  onClick={() => {
                    setQuantityCounter((current) => current + 1);
                  }}
                >
                  +
                </Button>
              </div>
              <div className="lg:col-span-4 lg:self-end">
                <Button type="reset" variant="outline" className="w-full border-border bg-background text-foreground shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.08)] hover:bg-background hover:shadow-[0_0_0_1px_rgba(15,23,42,0.22),0_4px_10px_rgba(15,23,42,0.12)] dark:bg-input/30 dark:hover:bg-input/30 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_2px_6px_rgba(2,6,23,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(148,163,184,0.5),0_4px_10px_rgba(2,6,23,0.45)]">Limpar</Button>
              </div>
            </div>
            <p className="hidden text-xs text-muted-foreground lg:block">Item(ns): {quantityCounter}</p>

            <div className="hidden gap-3 lg:grid lg:grid-cols-20 lg:items-end">
              <div className="grid gap-1 lg:col-span-5">
                <Label htmlFor={`${order.id}-unitPrice-view-desktop`}>Valor unitário</Label>
                <Input
                  id={`${order.id}-unitPrice-view-desktop`}
                  value={selectedProduct ? formatCurrency(selectedProductUnitPriceNumber) : "Selecione um produto"}
                  readOnly
                />
              </div>
              <div className="grid gap-1 lg:col-span-5">
                <Label htmlFor={`${order.id}-totalPrice-view-desktop`}>Valor total do item</Label>
                <Input
                  id={`${order.id}-totalPrice-view-desktop`}
                  value={selectedProduct ? formatCurrency(selectedProductTotalPrice) : "Selecione um produto"}
                  readOnly
                />
              </div>
              <div className="grid gap-1 lg:col-span-5">
                <Label htmlFor={`${order.id}-discount-desktop`}>Desconto (%)</Label>
                <Input
                  id={`${order.id}-discount-desktop`}
                  name="discount"
                  placeholder="0,00"
                  value={discountInput}
                  onChange={(event) => {
                    setDiscountInput(event.currentTarget.value);
                  }}
                />
              </div>
              <div className="lg:col-span-5 lg:pt-6">
                <SubmitButton className="w-full" disabled={!hasSelectedProduct}>Adicionar</SubmitButton>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:hidden">
              <div className="grid gap-3">
                <Label htmlFor={`${order.id}-quantity`}>Quantidade</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    id={`${order.id}-quantity`}
                    name="quantity"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={quantityCounter}
                    disabled={!hasSelectedProduct}
                    className="col-span-2"
                    onChange={(event) => {
                      const parsed = Number(event.currentTarget.value);

                      if (!Number.isFinite(parsed)) {
                        setQuantityCounter(1);
                        return;
                      }

                      setQuantityCounter(Math.max(1, Math.trunc(parsed)));
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="col-span-1 h-9 w-full border-border bg-background text-foreground shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.08)] hover:bg-background hover:shadow-[0_0_0_1px_rgba(15,23,42,0.22),0_4px_10px_rgba(15,23,42,0.12)] dark:bg-input/30 dark:hover:bg-input/30 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_2px_6px_rgba(2,6,23,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(148,163,184,0.5),0_4px_10px_rgba(2,6,23,0.45)]"
                    disabled={!hasSelectedProduct}
                    onClick={() => {
                      setQuantityCounter((current) => Math.max(1, current - 1));
                    }}
                  >
                    -
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="col-span-1 h-9 w-full border-border bg-background text-foreground shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.08)] hover:bg-background hover:shadow-[0_0_0_1px_rgba(15,23,42,0.22),0_4px_10px_rgba(15,23,42,0.12)] dark:bg-input/30 dark:hover:bg-input/30 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_2px_6px_rgba(2,6,23,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(148,163,184,0.5),0_4px_10px_rgba(2,6,23,0.45)]"
                    disabled={!hasSelectedProduct}
                    onClick={() => {
                      setQuantityCounter((current) => current + 1);
                    }}
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Item(ns): {quantityCounter}</p>
                <div className="grid grid-cols-1 gap-2">
                  <SubmitButton className="w-full" disabled={!hasSelectedProduct}>Adicionar</SubmitButton>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label htmlFor={`${order.id}-discount`}>Desconto (%)</Label>
                  <Input
                    id={`${order.id}-discount`}
                    name="discount"
                    placeholder="0,00"
                    value={discountInput}
                    onChange={(event) => {
                    setDiscountInput(event.currentTarget.value);
                  }}
                />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`${order.id}-unitPrice-view`}>Valor unitário</Label>
                  <Input
                    id={`${order.id}-unitPrice-view`}
                    value={selectedProduct ? formatCurrency(selectedProductUnitPriceNumber) : "Selecione um produto"}
                    readOnly
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`${order.id}-totalPrice-view`}>Valor total do item</Label>
                  <Input
                    id={`${order.id}-totalPrice-view`}
                    value={selectedProduct ? formatCurrency(selectedProductTotalPrice) : "Selecione um produto"}
                    readOnly
                  />
                </div>
                <Button type="reset" variant="outline" className="w-full border-border bg-background text-foreground shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.08)] hover:bg-background hover:shadow-[0_0_0_1px_rgba(15,23,42,0.22),0_4px_10px_rgba(15,23,42,0.12)] dark:bg-input/30 dark:hover:bg-input/30 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_2px_6px_rgba(2,6,23,0.35)] dark:hover:shadow-[0_0_0_1px_rgba(148,163,184,0.5),0_4px_10px_rgba(2,6,23,0.45)]">Limpar</Button>
              </div>
            </div>
            {addState.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {addState.error}
              </p>
            ) : null}
          </form>
        ) : (
          <p className="text-xs text-muted-foreground">
            Itens bloqueados para edição porque o pedido já foi confirmado.
          </p>
        )}
      </div>

      <div
        id={`${order.id}-items-list`}
        className="rounded-lg border border-border/60 bg-background p-4 lg:min-h-[560px]"
      >
        <h3 className="mb-3 text-sm font-semibold">Itens adicionados</h3>
        <p className="mb-3 text-xs text-muted-foreground lg:block">
          Visualização em tempo real dos itens em preparação e já adicionados ao pedido.
        </p>

        <div className="mb-3 hidden rounded-lg border border-dashed border-border/80 bg-muted/20 p-3 lg:grid lg:gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Pré-visualização em tempo real</p>
          {order.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item adicionado até o momento.</p>
          ) : (
            <div className="grid gap-1">
              {order.items.slice(0, 3).map((item) => (
                <p key={`preview-${item.id}`} className="text-sm">
                  {item.description || item.productName || "Item"} | Qtd: {item.quantity} | Total: {formatCurrency(item.totalPrice)}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2 lg:max-h-[420px] lg:overflow-y-auto lg:pr-1">
          {order.items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              Nenhum item cadastrado no pedido.
            </p>
          ) : (
            order.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{item.description || item.productName || "Item do pedido"}</p>
                  {order.status === "DRAFT" ? (
                    <ConfirmActionDialog
                      action={deleteOrderItemAction}
                      hiddenFields={{ orderId: order.id, itemId: item.id }}
                      title="Remover item"
                      description="Deseja remover este item do pedido?"
                      confirmLabel="Remover item"
                      pendingLabel="Removendo..."
                      confirmVariant="destructive"
                      trigger={(
                        <Button variant="ghost" size="icon-sm" aria-label="Remover item do pedido">
                          <Trash2 />
                        </Button>
                      )}
                    />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Quantidade: {item.quantity} | Desconto: {item.discount}% | Unitário: {formatCurrency(item.unitPrice)} | Total: {formatCurrency(item.totalPrice)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-background p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold">Resumo</p>
            <p className="text-xs text-muted-foreground">
              Total atual: {formatCurrency(order.total)} | Itens: {order.itemsCount}
            </p>
          </div>
          {order.status === "DRAFT" ? (
            <div className="grid gap-2 lg:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={order.items.length === 0}
                onClick={() => {
                  const target = document.getElementById(`${order.id}-items-list`);
                  target?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Atualizar item
              </Button>
              <form action={confirmAction} className="w-full">
                <input type="hidden" name="orderId" value={order.id} />
                <SubmitButton className="w-full">
                  <CheckCircle2 />
                  Confirmar pedido
                </SubmitButton>
              </form>
            </div>
          ) : (
            <Badge variant="default">Pedido confirmado</Badge>
          )}
        </div>
        {confirmState.error ? (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {confirmState.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
