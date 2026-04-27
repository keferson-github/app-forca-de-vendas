"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const lastNotice = useRef<string | null>(null);

  useEffect(() => {
    const notice = searchParams.get(paramName);

    if (!notice || lastNotice.current === notice) {
      return;
    }

    lastNotice.current = notice;
    const noticeConfig = messages[notice];

    if (!noticeConfig) {
      return;
    }

    const config: NoticeToastConfig = typeof noticeConfig === "string"
      ? { message: noticeConfig, variant }
      : { ...noticeConfig, variant: noticeConfig.variant ?? variant };

    if (config.preset === "success-celebration") {
      appToast.successCelebration(config.message, {
        description: config.description,
      });
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
  }, [messages, paramName, searchParams, variant]);
}
