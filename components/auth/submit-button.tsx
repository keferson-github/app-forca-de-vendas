"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export function SubmitButton({ children, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={`w-full ${className ?? ""}`}>
      {pending ? "Aguarde..." : children}
    </Button>
  );
}
