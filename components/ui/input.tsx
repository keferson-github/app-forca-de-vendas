import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      suppressHydrationWarning
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
        className
      )}
      {...props}
    />
  );
}

export { Input };
