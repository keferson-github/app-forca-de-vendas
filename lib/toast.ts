"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";

const defaultToastOptions: ExternalToast = {
  closeButton: true,
  duration: 4000,
};

function withDefaults(options?: ExternalToast): ExternalToast {
  return { ...defaultToastOptions, ...options };
}

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
  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id);
  },
  promise: sonnerToast.promise,
};
