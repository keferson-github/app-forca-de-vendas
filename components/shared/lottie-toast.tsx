"use client";

import { createPortal } from "react-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LottieToastTone = "success" | "info" | "warning" | "error";

type LottieToastProps = {
  title: string;
  description?: string;
  animationPath?: string;
  animationData?: object;
  animationSizeClass?: string;
  tone?: LottieToastTone;
  centered?: boolean;
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
  animationData: initialAnimationData,
  animationSizeClass = "size-12",
  tone = "success",
  centered = false,
  stackedOnMobile = false,
  bareOnMobile = false,
  overlayOnMobile = false,
  onClose,
}: LottieToastProps) {
  const animationSource = initialAnimationData ?? animationPath;

  const animation = animationSource ? (
    <div className={cn(animationSizeClass, "transform-gpu will-change-transform")} aria-hidden>
      <Player
        autoplay
        loop={false}
        keepLastFrame
        renderer="svg"
        src={animationSource as object | string}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  ) : (
    <div className="size-12 animate-pulse rounded-full bg-muted" aria-hidden />
  );

  const toastContent = bareOnMobile ? (
    <div className="relative z-[71] flex w-[min(92vw,360px)] flex-col items-center gap-2 text-center text-popover-foreground md:w-[min(92vw,420px)]">
      <div className="size-20 transform-gpu will-change-transform">{animation}</div>
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
  );

  return (
    <div className="relative">
      {overlayOnMobile && typeof document !== "undefined"
        ? createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[70] bg-[#FAFAFA]/82 backdrop-blur-sm dark:bg-black/62"
            aria-hidden
          />,
          document.body,
        )
        : null}

      {centered && typeof document !== "undefined"
        ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-[71] grid place-items-center p-4">
            <div className="pointer-events-auto">
              {toastContent}
            </div>
          </div>,
          document.body,
        )
        : toastContent}
    </div>
  );
}
