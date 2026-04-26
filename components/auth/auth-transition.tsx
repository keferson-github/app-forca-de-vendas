"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type AuthTransitionProps = {
  children: React.ReactNode;
};

export function AuthTransition({ children }: AuthTransitionProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const isRegister = pathname === "/register";

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const tl = gsap.timeline();

      // 1. Principal Container Animation (Slider-down + Flip)
      tl.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: isRegister ? -50 : 50,
          rotateX: isRegister ? -15 : 15,
          scale: 0.99,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 0.7,
          ease: "power4.out",
        }
      );

      // 2. Orchestrated Stagger (Internal Elements)
      const elements = containerRef.current.querySelectorAll(
        "form > div, button, .mt-10, .mt-5"
      );

      if (elements.length > 0) {
        tl.fromTo(
          elements,
          {
            opacity: 0,
            y: 10,
          },
          {
            opacity: 1,
            y: 0,
            stagger: 0.05,
            duration: 0.4,
            ease: "power2.out",
          },
          "-=0.4"
        );
      }
    },
    { dependencies: [pathname], scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ perspective: 1200, transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
