"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { appToast } from "@/lib/toast";

type NoticeToastVariant = "message" | "success" | "error" | "info" | "warning";

type UseNoticeToastOptions = {
  paramName?: string;
  variant?: NoticeToastVariant;
};

export function useNoticeToast(
  messages: Record<string, string>,
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
    const message = messages[notice];

    if (!message) {
      return;
    }

    switch (variant) {
      case "message":
        appToast.message(message);
        break;
      case "error":
        appToast.error(message);
        break;
      case "info":
        appToast.info(message);
        break;
      case "warning":
        appToast.warning(message);
        break;
      case "success":
      default:
        appToast.success(message);
        break;
    }
  }, [messages, paramName, searchParams, variant]);
}
