"use client";

import { useCallback, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function useSheetSlideGsap(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isClosingRef = useRef(false);

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      const element = contentRef.current;

      if (nextOpen) {
        isClosingRef.current = false;

        if (element) {
          gsap.killTweensOf(element);
          gsap.set(element, { clearProps: "transform,opacity,visibility" });
        }

        setOpen(true);
        return;
      }

      if (!open || !element) {
        setOpen(false);
        return;
      }

      isClosingRef.current = true;
      gsap.killTweensOf(element);

      gsap.to(element, {
        x: 48,
        autoAlpha: 0,
        duration: 0.28,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: () => {
          isClosingRef.current = false;
          setOpen(false);
          gsap.set(element, { clearProps: "transform,opacity,visibility" });
        },
      });
    },
    [open]
  );

  useGSAP(
    () => {
      if (!open || isClosingRef.current || !contentRef.current) {
        return;
      }

      gsap.fromTo(
        contentRef.current,
        {
          x: 64,
          autoAlpha: 0.75,
        },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.42,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
          overwrite: "auto",
        }
      );
    },
    { dependencies: [open], scope: contentRef }
  );

  return { open, onOpenChange, contentRef };
}
