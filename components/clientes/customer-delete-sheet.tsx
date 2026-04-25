"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  deleteCustomerAction,
  type CustomerFormState,
} from "@/app/(protected)/clientes/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type CustomerDeleteSheetProps = {
  id: string;
  name: string;
};

const initialState: CustomerFormState = {};

export function CustomerDeleteSheet({ id, name }: CustomerDeleteSheetProps) {
  const [state, action] = useActionState(deleteCustomerAction, initialState);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${name}`}>
          <Trash2 />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form action={action} className="flex min-h-full flex-col">
          <input type="hidden" name="id" value={id} />
          <SheetHeader>
            <SheetTitle>Excluir cadastro</SheetTitle>
            <SheetDescription>
              Esta acao remove o cadastro de {name}. Cadastros com pedidos ou historico
              vinculado nao podem ser excluidos.
            </SheetDescription>
          </SheetHeader>
          {state.error ? (
            <p className="mx-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <SheetFooter>
            <SubmitButton>Confirmar exclusao</SubmitButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
