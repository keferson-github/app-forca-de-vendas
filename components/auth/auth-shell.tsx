"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, LayoutGroup } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AuthTransition } from "@/components/auth/auth-transition";

type AuthShellProps = {
  children: React.ReactNode;
};

const authImage =
  "https://img.freepik.com/fotos-gratis/conceito-tecnologico-com-elemento-futurista_23-2151910926.jpg";

export function AuthShell({ children }: AuthShellProps) {
  const pathname = usePathname();
  const isRegister = pathname === "/register";

  const desktopCardRef = useRef<HTMLDivElement>(null);
  const imagePanelRef = useRef<HTMLDivElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const innerImageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!imagePanelRef.current || !formPanelRef.current || !innerImageRef.current) return;

    // Use a timeline for perfectly synchronized movement
    const tl = gsap.timeline({
      defaults: { ease: "power4.inOut", duration: 0.85 }
    });

    // Animate the horizontal swap
    tl.to(imagePanelRef.current, {
      x: isRegister ? "100%" : "0%",
    });

    tl.to(formPanelRef.current, {
      x: isRegister ? "-100%" : "0%",
    }, "<"); // Starts at the same time as the first one

    // Subtle parallax for the image inside
    tl.to(innerImageRef.current, {
      x: isRegister ? "-15%" : "0%",
    }, "<");

    // Breathing effect for the main container
    tl.to(desktopCardRef.current, {
      scale: 0.99,
      duration: 0.42,
      ease: "power2.in",
    }, "<");

    tl.to(desktopCardRef.current, {
      scale: 1,
      duration: 0.43,
      ease: "power2.out",
    }, ">");

  }, { dependencies: [isRegister], scope: desktopCardRef });

  return (
    <LayoutGroup>
      {/* Mobile Version */}
      <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-black sm:hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={authImage}
            alt="Conceito visual de CRM e gestão de relacionamento com clientes"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/60" />
        </div>

        <motion.div
          layout
          transition={{
            layout: { type: "spring", stiffness: 200, damping: 28 },
          }}
          className="relative z-10 mt-12 flex w-full flex-col overflow-hidden rounded-t-[32px] bg-card/95 pb-6 backdrop-blur-xl"
        >
          <div className="mb-4 w-full pt-4">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Segmented Control (Tabs) */}
          <div className="mx-auto mb-8 flex w-full max-w-[280px] rounded-2xl bg-muted/30 p-1">
            <Link
              href="/login"
              className={`relative flex-1 rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${!isRegister ? "text-primary" : "text-muted-foreground"
                }`}
            >
              {!isRegister && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-xl bg-card shadow-sm"
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                />
              )}
              <span className="relative z-10">Entrar</span>
            </Link>
            <Link
              href="/register"
              className={`relative flex-1 rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${isRegister ? "text-primary" : "text-muted-foreground"
                }`}
            >
              {isRegister && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-xl bg-card shadow-sm"
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                />
              )}
              <span className="relative z-10">Criar conta</span>
            </Link>
          </div>

          <section className="flex min-w-0 items-center justify-center px-5 pb-10">
            <AuthTransition>{children}</AuthTransition>
          </section>
        </motion.div>
      </main>

      {/* Desktop Version */}
      <main className="relative hidden min-h-screen overflow-hidden bg-[#f3f5f9] p-4 sm:block sm:p-6 lg:grid lg:place-items-center lg:p-10">
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

        <motion.div
          ref={desktopCardRef}
          layout
          className="relative z-10 mx-auto min-h-[calc(100vh-2rem)] w-full max-w-[1240px] overflow-hidden rounded-[28px] bg-card shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)] sm:min-h-[calc(100vh-3rem)] lg:min-h-[720px] lg:rounded-[44px]"
        >
          {/* imagePanel (Initially at Left) */}
          <section
            ref={imagePanelRef}
            className="relative hidden h-full p-3 lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:block lg:w-1/2"
            style={{ x: isRegister ? "100%" : "0%" }} // Initial state
          >
            <div className="relative h-full overflow-hidden rounded-[34px]">
              <div ref={innerImageRef} className="absolute inset-0 h-full w-[120%]" style={{ x: isRegister ? "-15%" : "0%" }}>
                <Image
                  src={authImage}
                  alt="Conceito visual de CRM e gestão de relacionamento com clientes"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
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

          {/* formPanel (Initially at Right) */}
          <section
            ref={formPanelRef}
            className="flex min-h-[calc(100vh-2rem)] min-w-0 items-center justify-center px-5 py-10 sm:min-h-[calc(100vh-3rem)] sm:px-8 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:px-14 lg:py-12"
            style={{ x: isRegister ? "-100%" : "0%" }} // Initial state
          >
            <AuthTransition>{children}</AuthTransition>
          </section>
        </motion.div>
      </main>
    </LayoutGroup>
  );
}
