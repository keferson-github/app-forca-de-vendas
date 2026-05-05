"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function SubmitButton({ children, className, disabled = false }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className={`w-full ${className ?? ""}`}>
      {pending ? "Aguarde..." : children}
    </Button>
  );
}
