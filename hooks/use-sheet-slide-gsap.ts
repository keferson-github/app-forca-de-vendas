"use client";

import { useCallback, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type SheetSide = "top" | "right" | "bottom" | "left";

type UseSheetSlideGsapConfig = {
  initialOpen?: boolean;
  side?: SheetSide;
};

function getOpenFromVars(side: SheetSide) {
  if (side === "left") {
    return { x: -64, autoAlpha: 0.75 };
  }

  if (side === "top") {
    return { y: -48, autoAlpha: 0.78 };
  }

  if (side === "bottom") {
    return { y: 48, autoAlpha: 0.78 };
  }

  return { x: 64, autoAlpha: 0.75 };
}

function getCloseToVars(side: SheetSide) {
  if (side === "left") {
    return { x: -48, autoAlpha: 0 };
  }

  if (side === "top") {
    return { y: -36, autoAlpha: 0 };
  }

  if (side === "bottom") {
    return { y: 36, autoAlpha: 0 };
  }

  return { x: 48, autoAlpha: 0 };
}

export function useSheetSlideGsap(config: UseSheetSlideGsapConfig = {}) {
  const initialOpen = config.initialOpen ?? false;
  const side = config.side ?? "right";
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

      if (!open || !element || isClosingRef.current) {
        setOpen(false);
        return;
      }

      isClosingRef.current = true;
      gsap.killTweensOf(element);

      gsap.to(element, {
        ...getCloseToVars(side),
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
    [open, side]
  );

  useGSAP(
    () => {
      if (!open || isClosingRef.current || !contentRef.current) {
        return;
      }

      gsap.fromTo(
        contentRef.current,
        getOpenFromVars(side),
        {
          x: 0,
          y: 0,
          autoAlpha: 1,
          duration: 0.42,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
          overwrite: "auto",
        }
      );
    },
    { dependencies: [open, side], scope: contentRef }
  );

  return { open, onOpenChange, contentRef };
}
