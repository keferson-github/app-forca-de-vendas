"use client";

import { useActionState } from "react";
import { UserPlus, Users } from "lucide-react";
import {
  createCustomerAction,
  updateCustomerAction,
  type CustomerFormState,
} from "@/app/(protected)/clientes/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useSheetSlideGsap } from "@/hooks/use-sheet-slide-gsap";

export type CustomerListItem = {
  id: string;
  name: string;
  companyName: string | null;
  cnpjCpf: string | null;
  customerCode: string | null;
  phone: string | null;
  commercialAddress: string | null;
  deliveryAddress: string | null;
  isProspect: boolean;
  prospectStatus: "PROSPECT" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
  createdAt: string;
  updatedAt: string;
  counts: {
    orders: number;
    crmNotes: number;
    contacts: number;
  };
};

type CustomerFormSheetProps = {
  customer?: CustomerListItem;
  defaultIsProspect?: boolean;
  initialOpen?: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon-sm";
  trigger?: React.ReactNode;
};

const initialState: CustomerFormState = {};

const statusLabels = {
  PROSPECT: "Prospect",
  QUALIFIED: "Qualificado",
  DISQUALIFIED: "Desqualificado",
  CONVERTED: "Convertido",
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  if (!digits) {
    return "";
  }

  if (digits.length <= 11) {
    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }

    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
      6,
      9
    )}-${digits.slice(9)}`;
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
      5,
      8
    )}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(
    8,
    12
  )}-${digits.slice(12)}`;
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

  const areaCode = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (digits.length <= 10) {
    const firstPart = rest.slice(0, 4);
    const secondPart = rest.slice(4);
    return secondPart ? `(${areaCode}) ${firstPart}-${secondPart}` : `(${areaCode}) ${firstPart}`;
  }

  const firstPart = rest.slice(0, 5);
  const secondPart = rest.slice(5);
  return `(${areaCode}) ${firstPart}-${secondPart}`;
}

export function CustomerFormSheet({
  customer,
  defaultIsProspect = false,
  initialOpen = false,
  triggerLabel,
  title,
  description,
  variant = "default",
  size = "default",
  trigger,
}: CustomerFormSheetProps) {
  const action = customer ? updateCustomerAction : createCustomerAction;
  const [state, formAction] = useActionState(action, initialState);
  const { open, onOpenChange, contentRef } = useSheetSlideGsap(initialOpen);
  const values = state.values;
  const isProspect = values?.isProspect ?? customer?.isProspect ?? defaultIsProspect;
  const prospectStatus =
    values?.prospectStatus
    ?? customer?.prospectStatus
    ?? (defaultIsProspect ? "PROSPECT" : "CONVERTED");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant={variant} size={size}>
            {defaultIsProspect ? <UserPlus /> : <Users />}
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
            {customer ? <input type="hidden" name="id" value={values?.id || customer.id} /> : null}

            <div className="grid gap-2">
              <Label htmlFor={`${customer?.id ?? "new"}-name`}>Nome do cliente</Label>
              <Input
                id={`${customer?.id ?? "new"}-name`}
                name="name"
                defaultValue={values?.name ?? customer?.name ?? ""}
                placeholder="Nome do cliente"
                autoComplete="organization"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${customer?.id ?? "new"}-companyName`}>Empresa</Label>
                <Input
                  id={`${customer?.id ?? "new"}-companyName`}
                  name="companyName"
                  defaultValue={values?.companyName ?? customer?.companyName ?? ""}
                  placeholder="Razao social ou fantasia"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${customer?.id ?? "new"}-cnpjCpf`}>CNPJ/CPF</Label>
                <Input
                  id={`${customer?.id ?? "new"}-cnpjCpf`}
                  name="cnpjCpf"
                  defaultValue={values?.cnpjCpf ?? formatCpfCnpj(customer?.cnpjCpf ?? "")}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  maxLength={18}
                  onChange={(event) => {
                    event.currentTarget.value = formatCpfCnpj(event.currentTarget.value);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${customer?.id ?? "new"}-customerCode`}>Numero do cliente</Label>
                <Input
                  id={`${customer?.id ?? "new"}-customerCode`}
                  name="customerCode"
                  defaultValue={values?.customerCode ?? customer?.customerCode ?? ""}
                  placeholder="Codigo interno"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${customer?.id ?? "new"}-phone`}>Contato</Label>
                <Input
                  id={`${customer?.id ?? "new"}-phone`}
                  name="phone"
                  defaultValue={values?.phone ?? formatPhone(customer?.phone ?? "")}
                  placeholder="Telefone ou WhatsApp"
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
              <Label htmlFor={`${customer?.id ?? "new"}-commercialAddress`}>
                Endereco comercial
              </Label>
              <Textarea
                id={`${customer?.id ?? "new"}-commercialAddress`}
                name="commercialAddress"
                defaultValue={values?.commercialAddress ?? customer?.commercialAddress ?? ""}
                placeholder="Rua, numero, bairro, cidade e UF"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${customer?.id ?? "new"}-deliveryAddress`}>
                Endereco de entrega
              </Label>
              <Textarea
                id={`${customer?.id ?? "new"}-deliveryAddress`}
                name="deliveryAddress"
                defaultValue={values?.deliveryAddress ?? customer?.deliveryAddress ?? ""}
                placeholder="Endereco usado para entregas"
              />
            </div>

            <div className="grid gap-4 rounded-lg bg-muted/45 p-3 sm:grid-cols-[1fr_180px]">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="isProspect" defaultChecked={isProspect} />
                Marcar como prospect
              </label>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select name="prospectStatus" defaultValue={prospectStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <SubmitButton>{customer ? "Salvar alteracoes" : "Salvar cadastro"}</SubmitButton>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
