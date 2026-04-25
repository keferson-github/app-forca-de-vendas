"use client";

import { usePathname } from "next/navigation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clientes": "Clientes",
  "/transportadoras": "Transportadoras",
  "/produtos": "Produtos",
  "/pedidos": "Pedidos",
  "/crm": "CRM",
  "/checkins": "Check-ins",
  "/anotacoes": "Anotações",
  "/agenda": "Agenda",
};

function resolveTitle(pathname: string) {
  const match = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  return match ? pageTitles[match] : "Força de Vendas";
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 bg-background/78 shadow-[var(--shadow-header)] transition-[width,height] ease-linear backdrop-blur supports-[backdrop-filter]:bg-background/68 group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="grid">
          <h1 className="text-base font-medium">{resolveTitle(pathname)}</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Indicadores, clientes e pedidos em uma visão comercial integrada.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <AnimatedThemeToggler
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-4"
            aria-label="Alternar tema claro ou escuro"
          />
        </div>
      </div>
    </header>
  );
}
