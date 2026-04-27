"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { appToast } from "@/lib/toast";

type NoticeToastVariant = "message" | "success" | "error" | "info" | "warning";
type NoticeAnimatedTone = "success" | "info" | "warning" | "error";

export type NoticeToastConfig = {
  message: string;
  variant?: NoticeToastVariant;
  preset?: "success-celebration";
  animationPath?: string;
  animationTone?: NoticeAnimatedTone;
  description?: string;
  mobileCentered?: boolean;
  stackedOnMobile?: boolean;
  bareOnMobile?: boolean;
  overlayOnMobile?: boolean;
};

type UseNoticeToastOptions = {
  paramName?: string;
  variant?: NoticeToastVariant;
};

export function useNoticeToast(
  messages: Record<string, string | NoticeToastConfig>,
  { paramName = "notice", variant = "success" }: UseNoticeToastOptions = {},
) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastNoticeKey = useRef<string | null>(null);

  useEffect(() => {
    const notice = searchParams.get(paramName);
    const noticeId = searchParams.get("noticeId");
    const noticeKey = notice ? `${notice}:${noticeId ?? ""}` : null;

    if (!notice) {
      lastNoticeKey.current = null;
      return;
    }

    if (lastNoticeKey.current === noticeKey) {
      return;
    }

    const clearNoticeParam = () => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete(paramName);
      nextParams.delete("noticeId");

      const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    };

    lastNoticeKey.current = noticeKey;
    const noticeConfig = messages[notice];

    if (!noticeConfig) {
      clearNoticeParam();
      return;
    }

    const config: NoticeToastConfig = typeof noticeConfig === "string"
      ? { message: noticeConfig, variant }
      : { ...noticeConfig, variant: noticeConfig.variant ?? variant };

    if (config.preset === "success-celebration") {
      appToast.successCelebration(config.message, {
        description: config.description,
      });
      clearNoticeParam();
      return;
    }

    if (config.animationPath) {
      const classNames = [
        config.mobileCentered ? "toast-mobile-centered" : "",
        config.bareOnMobile ? "toast-mobile-bare" : "",
      ].filter(Boolean).join(" ");

      appToast.animated(config.message, {
        animationPath: config.animationPath,
        tone: config.animationTone ?? "success",
        description: config.description,
        stackedOnMobile: config.stackedOnMobile,
        bareOnMobile: config.bareOnMobile,
        overlayOnMobile: config.overlayOnMobile,
        className: classNames || undefined,
      });
      clearNoticeParam();
      return;
    }

    switch (config.variant) {
      case "message":
        appToast.message(config.message);
        break;
      case "error":
        appToast.error(config.message);
        break;
      case "info":
        appToast.info(config.message);
        break;
      case "warning":
        appToast.warning(config.message);
        break;
      case "success":
      default:
        appToast.success(config.message);
        break;
    }
    clearNoticeParam();
  }, [messages, paramName, pathname, router, searchParams, variant]);
}
