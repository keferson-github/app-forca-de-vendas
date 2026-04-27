"use client";

import { createElement } from "react";
import { LottieToast, type LottieToastTone } from "@/components/shared/lottie-toast";
import { SuccessCelebrationToast } from "@/components/shared/success-celebration-toast";
import { toast as sonnerToast, type ExternalToast } from "sonner";

const defaultToastOptions: ExternalToast = {
  closeButton: true,
  duration: 4000,
};

function withDefaults(options?: ExternalToast): ExternalToast {
  return { ...defaultToastOptions, ...options };
}

export type AnimatedToastOptions = ExternalToast & {
  description?: string;
  animationPath: string;
  tone?: LottieToastTone;
  stackedOnMobile?: boolean;
  bareOnMobile?: boolean;
  overlayOnMobile?: boolean;
};

export type SuccessCelebrationToastOptions = ExternalToast & {
  description?: string;
};

export const appToast = {
  message(message: string, options?: ExternalToast) {
    return sonnerToast(message, withDefaults(options));
  },
  success(message: string, options?: ExternalToast) {
    return sonnerToast.success(message, withDefaults(options));
  },
  error(message: string, options?: ExternalToast) {
    return sonnerToast.error(message, withDefaults(options));
  },
  info(message: string, options?: ExternalToast) {
    return sonnerToast.info(message, withDefaults(options));
  },
  warning(message: string, options?: ExternalToast) {
    return sonnerToast.warning(message, withDefaults(options));
  },
  loading(message: string, options?: ExternalToast) {
    return sonnerToast.loading(message, withDefaults(options));
  },
  animated(message: string, options: AnimatedToastOptions) {
    const {
      description,
      animationPath,
      tone = "success",
      stackedOnMobile,
      bareOnMobile,
      overlayOnMobile,
      ...toastOptions
    } = options;

    return sonnerToast.custom(
      (id) => createElement(LottieToast, {
        title: message,
        description,
        animationPath,
        tone,
        stackedOnMobile,
        bareOnMobile,
        overlayOnMobile,
        onClose: () => sonnerToast.dismiss(id),
      }),
      withDefaults(toastOptions),
    );
  },
  successCelebration(message: string, options?: SuccessCelebrationToastOptions) {
    const { description, ...toastOptions } = options ?? {};

    return sonnerToast.custom(
      (id) => createElement(SuccessCelebrationToast, {
        title: message,
        description,
        onClose: () => sonnerToast.dismiss(id),
      }),
      withDefaults({
        className: "toast-success-centered toast-mobile-bare",
        ...toastOptions,
      }),
    );
  },
  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id);
  },
  promise: sonnerToast.promise,
};
