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

const collapsedBrandShellClass =
  "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:mt-3 group-data-[collapsible=icon]:mb-2 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:rounded-[1.8rem] group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none";

const collapsedBrandMarkClass =
  "relative flex aspect-square size-9 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)),linear-gradient(155deg,rgba(15,23,42,0.94),rgba(6,10,18,0.98))] shadow-[0_20px_34px_-24px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.08)] group-data-[collapsible=icon]:size-[3.15rem] group-data-[collapsible=icon]:rounded-[1.55rem] group-data-[collapsible=icon]:border-white/10 group-data-[collapsible=icon]:shadow-[0_24px_42px_-26px_rgba(0,0,0,0.88),0_0_0_1px_rgba(148,163,184,0.08),inset_0_1px_0_rgba(255,255,255,0.11)]";

const collapsedBrandMarkCleanClass =
  "relative flex aspect-square size-[3.15rem] items-center justify-center overflow-hidden rounded-full border-0 bg-transparent shadow-none";

const collapsedPrimaryCtaClass =
  "min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground group-data-[collapsible=icon]:!border-0 group-data-[collapsible=icon]:!bg-transparent group-data-[collapsible=icon]:!shadow-none group-data-[collapsible=icon]:text-emerald-300 group-data-[collapsible=icon]:hover:-translate-y-0.5 group-data-[collapsible=icon]:hover:text-emerald-200 group-data-[collapsible=icon]:active:translate-y-0 group-data-[collapsible=icon]:[&>a>svg]:size-[20px]";

const collapsedPrimaryCtaCleanClass =
  "group-data-[collapsible=icon]:text-emerald-300 group-data-[collapsible=icon]:transition-[transform,color,opacity] group-data-[collapsible=icon]:duration-200 group-data-[collapsible=icon]:hover:-translate-y-0.5 group-data-[collapsible=icon]:hover:text-emerald-200 group-data-[collapsible=icon]:[&>a>svg]:size-[19px] group-data-[collapsible=icon]:[&>a>span]:hidden";

const collapsedNavButtonClass =
  "group-data-[collapsible=icon]:text-sidebar-foreground/78 group-data-[collapsible=icon]:transition-[transform,color,opacity] group-data-[collapsible=icon]:duration-200 group-data-[collapsible=icon]:hover:-translate-y-0.5 group-data-[collapsible=icon]:hover:text-white group-data-[collapsible=icon]:data-[active=true]:text-white group-data-[collapsible=icon]:[&>a>svg]:size-[18px]";

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
              {(() => {
                const active = isActivePath(pathname, item.url);

                return (
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={active}
                className={cn(
                  collapsedNavButtonClass,
                  item.title === "Clientes"
                    && "group-data-[collapsible=icon]:data-[active=true]:text-cyan-300 group-data-[collapsible=icon]:data-[active=true]:drop-shadow-[0_0_10px_rgba(34,211,238,0.32)]"
                )}
              >
                <Link href={item.url} onClick={handleNavigate}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
                );
              })()}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsedDesktop = !isMobile && state === "collapsed";
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
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                collapsedBrandShellClass
              )}
            >
              <Link
                href="/dashboard"
                onClick={handleNavigate}
                className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
              >
                <div
                  className={isCollapsedDesktop ? collapsedBrandMarkCleanClass : collapsedBrandMarkClass}
                >
                  {isCollapsedDesktop ? null : (
                    <>
                      <span className="pointer-events-none absolute inset-[1px] rounded-[inherit] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_48%)] opacity-75 group-data-[collapsible=icon]:opacity-100" />
                      <span className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-[radial-gradient(circle,rgba(45,212,191,0.22),transparent_62%)] opacity-0 blur-xl group-data-[collapsible=icon]:opacity-100" />
                      <span className="pointer-events-none absolute inset-[6px] rounded-[1.15rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.36),rgba(15,23,42,0.08))] group-data-[collapsible=icon]:inset-[5px] group-data-[collapsible=icon]:rounded-[1.3rem]" />
                    </>
                  )}
                  <Image
                    src="/img/logo-esb.jpeg"
                    alt="Logo Eu Sou o Bichão"
                    width={44}
                    height={44}
                    className="relative z-10 h-full w-full rounded-[inherit] object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
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
                  tooltip="Novo cliente"
                  className={cn(
                    isCollapsedDesktop
                      ? collapsedPrimaryCtaCleanClass
                      : "rounded-xl border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),linear-gradient(135deg,rgba(16,185,129,0.94),rgba(13,148,136,0.92))] text-white shadow-[0_18px_32px_-20px_rgba(20,184,166,0.72)] hover:text-white hover:shadow-[0_20px_36px_-20px_rgba(20,184,166,0.82)]",
                    collapsedPrimaryCtaClass
                  )}
                >
                  <Link
                    href="/clientes?open=new-customer"
                    onClick={handleNavigate}
                    className={cn(isCollapsedDesktop && "flex items-center justify-center")}
                  >
                    {isCollapsedDesktop ? <IconUserPlus /> : <IconCirclePlusFilled />}
                    <span>Novo cliente</span>
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
