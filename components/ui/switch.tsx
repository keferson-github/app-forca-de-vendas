"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted",
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  )
}

export { Switch }
