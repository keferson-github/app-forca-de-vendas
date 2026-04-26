"use client";

import type * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  IconCalendar,
  IconCheckupList,
  IconCirclePlusFilled,
  IconClipboardList,
  IconLayoutDashboard,
  IconInnerShadowTop,
  IconLogout,
  IconMapPinCheck,
  IconNotes,
  IconPackage,
  IconPlugConnected,
  IconTruck,
  IconUserPlus,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";
import { logoutAction } from "@/app/(protected)/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: Icon;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email?: string | null;
  };
};

const primaryItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: IconLayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: IconUsers },
  { title: "Pedidos", url: "/pedidos", icon: IconClipboardList },
  { title: "Produtos", url: "/produtos", icon: IconPackage },
];

const operationItems: NavItem[] = [
  { title: "Transportadoras", url: "/transportadoras", icon: IconTruck },
  { title: "CRM", url: "/crm", icon: IconUserPlus },
  { title: "Checkins", url: "/checkins", icon: IconMapPinCheck },
  { title: "Anotacoes", url: "/anotacoes", icon: IconNotes },
  { title: "Agenda", url: "/agenda", icon: IconCalendar },
  { title: "Integracoes", url: "/integracoes/bling", icon: IconPlugConnected },
];

function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  function handleNavigate() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActivePath(pathname, item.url)}
                className={cn(
                  item.title === "Dashboard" && "group-data-[collapsible=icon]:text-indigo-500"
                )}
              >
                <Link href={item.url} onClick={handleNavigate}>
                  <item.icon className={cn(
                    item.title === "Dashboard" && "group-data-[collapsible=icon]:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  )} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function handleNavigate() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar collapsible="icon" className="dark" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href="/dashboard" onClick={handleNavigate}>
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-full border border-sidebar-border bg-white group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:mx-auto">
                  <Image
                    src="/img/logo-esb.jpeg"
                    alt="Logo Eu Sou o Bichão"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Forca de Vendas</span>
                  <span className="truncate text-xs">Representante Comercial</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Novo pedido"
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:bg-linear-to-br group-data-[collapsible=icon]:from-emerald-400 group-data-[collapsible=icon]:to-teal-600 group-data-[collapsible=icon]:shadow-md group-data-[collapsible=icon]:shadow-emerald-500/20"
                >
                  <Link href="/pedidos" onClick={handleNavigate}>
                    <IconCirclePlusFilled />
                    <span>Novo pedido</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavGroup label="Principal" items={primaryItems} />
        <NavGroup label="Operacao" items={operationItems} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user.name}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-semibold text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8">
                {initials || "U"}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email ?? "Sessao ativa"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logoutAction}>
              <SidebarMenuButton asChild tooltip="Sair">
                <button type="submit">
                  <IconLogout />
                  <span>Sair</span>
                </button>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="opacity-70">
              <IconCheckupList />
              <span>Versao 0.1.0</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
