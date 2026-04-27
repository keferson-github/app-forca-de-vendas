"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Lottie from "lottie-react";
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

const animationCache = new Map<string, object>();

export function LottieToast({
  title,
  description,
  animationPath,
  animationData: initialAnimationData,
  animationSizeClass = "size-12",
  tone = "success",
  stackedOnMobile = false,
  bareOnMobile = false,
  overlayOnMobile = false,
  onClose,
}: LottieToastProps) {
  const [fetchedAnimationData, setFetchedAnimationData] = useState<object | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (initialAnimationData || !animationPath) {
      setFetchedAnimationData(null);
      return undefined;
    }

    let isActive = true;

    const cached = animationCache.get(animationPath);

    if (cached) {
      setFetchedAnimationData(cached);
      return () => {
        isActive = false;
      };
    }

    fetch(animationPath)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Animation file not found");
        }

        const payload = await response.json();

        if (isActive) {
          animationCache.set(animationPath, payload as object);
          setFetchedAnimationData(payload);
        }
      })
      .catch(() => {
        if (isActive) {
          setFetchedAnimationData(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [animationPath, initialAnimationData]);

  const resolvedAnimationData = initialAnimationData ?? fetchedAnimationData;

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const toastElement = rootRef.current?.closest("[data-sonner-toast]") as HTMLElement | null;

    if (!toastElement) {
      return undefined;
    }

    const syncRemovingState = () => {
      const nextIsRemoving = toastElement.dataset.removed === "true";

      setIsRemoving((current) => (current === nextIsRemoving ? current : nextIsRemoving));
    };

    syncRemovingState();

    const observer = new MutationObserver(syncRemovingState);
    observer.observe(toastElement, {
      attributes: true,
      attributeFilter: ["data-removed"],
    });

    return () => {
      observer.disconnect();
    };
  }, [mounted]);

  const animation = useMemo(() => {
    if (!resolvedAnimationData) {
      return <div className="size-12 animate-pulse rounded-full bg-muted" aria-hidden />;
    }

    return (
      <Lottie
        animationData={resolvedAnimationData}
        loop={false}
        autoplay
        className={cn(animationSizeClass, "transform-gpu will-change-transform")}
        aria-hidden
      />
    );
  }, [animationSizeClass, resolvedAnimationData]);

  return (
    <div ref={rootRef} className="relative">
      {overlayOnMobile && mounted
        ? createPortal(
          <div
            className={cn(
              "pointer-events-none fixed inset-0 z-[70] bg-[#FAFAFA]/82 backdrop-blur-sm transition-opacity duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-black/62",
              isRemoving ? "opacity-0 md:duration-180" : "opacity-100",
            )}
            aria-hidden
          />,
          document.body,
        )
        : null}

      {bareOnMobile ? (
        <div className="relative z-[71] flex w-[min(92vw,360px)] flex-col items-center gap-2 text-center text-popover-foreground">
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
      )}
    </div>
  );
}
