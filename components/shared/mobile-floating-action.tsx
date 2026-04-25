"use client";

import { type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileFloatingActionProps = {
  children: React.ReactNode;
  className?: string;
};

export function MobileFloatingAction({ children, className }: MobileFloatingActionProps) {
  return <div className={cn("fixed right-4 bottom-4 z-40 md:hidden", className)}>{children}</div>;
}

export function MobileFloatingActionButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      className={cn("h-12 rounded-full px-4 shadow-lg shadow-primary/30", className)}
      {...props}
    />
  );
}