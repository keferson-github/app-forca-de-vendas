"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Lottie from "lottie-react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LottieToastTone = "success" | "info" | "warning" | "error";

type LottieToastProps = {
  title: string;
  description?: string;
  animationPath: string;
  tone?: LottieToastTone;
  stackedOnMobile?: boolean;
  bareOnMobile?: boolean;
  overlayOnMobile?: boolean;
  onClose: () => void;
};

const toneClasses: Record<LottieToastTone, string> = {
  success: "border-emerald-500/35 bg-emerald-500/10",
  info: "border-sky-500/35 bg-sky-500/10",
  warning: "border-amber-500/35 bg-amber-500/10",
  error: "border-rose-500/35 bg-rose-500/10",
};

export function LottieToast({
  title,
  description,
  animationPath,
  tone = "success",
  stackedOnMobile = false,
  bareOnMobile = false,
  overlayOnMobile = false,
  onClose,
}: LottieToastProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    fetch(animationPath)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Animation file not found");
        }

        const payload = await response.json();

        if (isActive) {
          setAnimationData(payload);
        }
      })
      .catch(() => {
        if (isActive) {
          setAnimationData(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [animationPath]);

  const animation = useMemo(() => {
    if (!animationData) {
      return <div className="size-12 animate-pulse rounded-full bg-muted" aria-hidden />;
    }

    return (
      <Lottie
        animationData={animationData}
        loop={false}
        autoplay
        className="size-12"
        aria-hidden
      />
    );
  }, [animationData]);

  return (
    <div className="relative">
      {overlayOnMobile && mounted
        ? createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[70] bg-black/45 backdrop-blur-[1px] md:hidden"
            aria-hidden
          />,
          document.body,
        )
        : null}

      {bareOnMobile ? (
        <div className="relative z-[71] flex w-[min(92vw,360px)] flex-col items-center gap-2 text-center text-popover-foreground">
          <div className="size-16">{animation}</div>
          <div className="min-w-0">
            <p className="text-base font-semibold leading-tight">{title}</p>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={cn(
          "relative flex w-[min(92vw,360px)] items-center gap-3 rounded-lg border bg-popover p-3 text-popover-foreground shadow-[var(--shadow-surface-strong)]",
          stackedOnMobile && "flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left",
        )}>
          <div className={cn("grid size-12 place-items-center rounded-md border", toneClasses[tone])}>
            {animation}
          </div>

          <div className={cn(
            "min-w-0 flex-1 justify-center min-h-12 flex flex-col",
            stackedOnMobile && "items-center sm:items-start",
          )}>
            <p className="text-sm font-semibold leading-tight">{title}</p>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              "-mr-1 -mt-1",
              stackedOnMobile && "absolute top-2 right-2 mr-0 mt-0",
            )}
            onClick={onClose}
            aria-label="Fechar notificação"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
