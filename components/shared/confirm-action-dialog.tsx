"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type ConfirmActionState = {
  error?: string;
};

type ConfirmActionDialogProps = {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  action: (
    state: ConfirmActionState,
    formData: FormData
  ) => Promise<ConfirmActionState>;
  hiddenFields?: Record<string, string | number | boolean | null | undefined>;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
};

const initialState: ConfirmActionState = {};

function ConfirmSubmitButton({
  confirmLabel,
  pendingLabel,
  confirmVariant,
}: {
  confirmLabel: string;
  pendingLabel: string;
  confirmVariant: "default" | "destructive";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={confirmVariant} disabled={pending}>
      {pending ? pendingLabel : confirmLabel}
    </Button>
  );
}

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  action,
  hiddenFields,
  confirmLabel = "Confirmar",
  pendingLabel = "Processando...",
  cancelLabel = "Cancelar",
  confirmVariant = "destructive",
}: ConfirmActionDialogProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction} className="grid gap-4">
          {Object.entries(hiddenFields ?? {}).map(([key, value]) => {
            if (value === null || value === undefined) {
              return null;
            }

            return <input key={key} type="hidden" name={key} value={String(value)} />;
          })}

          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>

          {state.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <ConfirmSubmitButton
              confirmLabel={confirmLabel}
              pendingLabel={pendingLabel}
              confirmVariant={confirmVariant}
            />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
