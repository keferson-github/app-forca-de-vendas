"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthTransition } from "@/components/auth/auth-transition";

type AuthShellProps = {
  children: React.ReactNode;
};

const authImage =
  "https://img.freepik.com/fotos-gratis/conceito-tecnologico-com-elemento-futurista_23-2151910926.jpg";

export function AuthShell({ children }: AuthShellProps) {
  const pathname = usePathname();
  const isRegister = pathname === "/register";
  const previousPathname = useRef(pathname);
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    setIsSwapping(false);

    const frame = window.requestAnimationFrame(() => {
      setIsSwapping(true);
    });
    const timeout = window.setTimeout(() => {
      setIsSwapping(false);
    }, 760);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return (
    <main className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(240,243,248,0.95)_34%,_rgba(228,233,241,0.92)_100%)] px-4 pb-0 pt-0 sm:px-6 sm:pt-6 lg:grid lg:place-items-center lg:bg-[#f3f5f9] lg:p-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[6vh] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(255,255,255,0))] lg:hidden" />
      <div className="pointer-events-none absolute -top-20 right-[-14%] h-48 w-48 rounded-full bg-black/6 blur-3xl lg:hidden" />
      <div className="pointer-events-none absolute top-18 left-[-14%] h-36 w-36 rounded-full bg-white/75 blur-3xl lg:hidden" />
      <div className="pointer-events-none absolute inset-x-0 top-1.5 z-10 flex justify-center px-4 lg:hidden">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/74 px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-foreground/72 uppercase shadow-[0_16px_34px_-24px_rgba(15,23,42,0.28)] backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-foreground" />
          <span>Força de Vendas</span>
        </div>
      </div>

      <div className="absolute inset-y-0 left-0 hidden w-[58%] lg:block">
        <Image
          src={authImage}
          alt="Conceito visual de CRM e gestão de relacionamento com clientes"
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-end overflow-hidden lg:min-h-[720px] lg:flex-none lg:rounded-[44px] lg:bg-card lg:shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)]">
        <section
          className={[
            "relative hidden h-full p-3 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:block lg:w-1/2",
            isRegister ? "lg:translate-x-full" : "lg:translate-x-0",
            isSwapping ? "auth-swap-fade" : "",
          ].join(" ")}
        >
          <div className="relative h-full overflow-hidden rounded-[34px]">
            <Image
              src={authImage}
              alt="Conceito visual de CRM e gestão de relacionamento com clientes"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/75 to-black/95" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-8 text-white">
              <h1 className="text-sm font-semibold">inteligente e integrada</h1>
              <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                Representante Comercial
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
              <p className="text-sm font-medium text-white/85">Ambiente corporativo</p>
              <h1 className="mt-3 max-w-lg text-4xl leading-tight font-semibold tracking-normal">
                Gestão comercial conectada aos indicadores do dia.
              </h1>
              <p className="mt-4 max-w-lg text-base text-white/85">
                Acompanhe clientes, pedidos, agenda e CRM em uma operação pensada para equipes
                comerciais.
              </p>
            </div>
          </div>
        </section>

        <section
          className={[
            "flex min-h-0 min-w-0 flex-1 items-end justify-center px-0 pb-0 pt-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:pt-2 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:items-center lg:px-14 lg:py-12",
            isRegister ? "lg:-translate-x-full" : "lg:translate-x-0",
            isSwapping ? "auth-swap-fade" : "",
          ].join(" ")}
        >
          <AuthTransition>{children}</AuthTransition>
        </section>
      </div>
    </main>
  );
}
