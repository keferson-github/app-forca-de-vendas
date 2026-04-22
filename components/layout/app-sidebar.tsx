"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeInfo, BookText, CalendarClock, CheckCheck, ClipboardList, LayoutDashboard, Package, Truck, UserRoundPlus, Users } from "lucide-react";
import { logoutAction } from "@/app/(protected)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/transportadoras", label: "Transportadoras", icon: Truck },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/crm", label: "CRM", icon: UserRoundPlus },
  { href: "/checkins", label: "Checkins", icon: CheckCheck },
  { href: "/anotacoes", label: "Anotacoes", icon: BookText },
  { href: "/agenda", label: "Agenda", icon: CalendarClock },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-border/50 bg-card/95 p-4 shadow-[0_12px_30px_-26px_rgba(0,0,0,0.5)] lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="rounded-lg bg-primary p-2 text-primary-foreground">
          <BadgeInfo className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">App Forca de Vendas</p>
          <p className="text-xs text-muted-foreground">Etapa 1 - Fundacao</p>
        </div>
      </div>
      <nav className="grid gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction} className="mt-8">
        <Button variant="secondary" className="w-full">
          Sair
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">Versao: 0.1.0</p>
    </aside>
  );
}
