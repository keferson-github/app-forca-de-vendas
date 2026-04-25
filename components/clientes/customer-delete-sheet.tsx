"use client";

import { Trash2 } from "lucide-react";
import { deleteCustomerAction } from "@/app/(protected)/clientes/actions";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";

type CustomerDeleteSheetProps = {
  id: string;
  name: string;
};

export function CustomerDeleteSheet({ id, name }: CustomerDeleteSheetProps) {
  return (
    <ConfirmActionDialog
      action={deleteCustomerAction}
      hiddenFields={{ id }}
      title="Excluir cadastro"
      description={
        <>
          Esta ação remove o cadastro de {name}. Cadastros com pedidos ou histórico vinculado
          não podem ser excluídos.
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
