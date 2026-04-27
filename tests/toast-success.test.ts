import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/shared/success-lottie-icon", () => ({
  SuccessLottieIcon: function MockSuccessLottieIcon() {
    return null;
  },
}));

vi.mock("@/components/shared/lottie-toast", () => ({
  LottieToast: function MockLottieToast() {
    return null;
  },
}));

vi.mock("sonner", () => {
  const toast: any = vi.fn();

  toast.success = vi.fn(() => "success-toast-id");
  toast.error = vi.fn();
  toast.info = vi.fn();
  toast.warning = vi.fn();
  toast.loading = vi.fn();
  toast.custom = vi.fn();
  toast.dismiss = vi.fn();
  toast.promise = vi.fn();

  return {
    toast,
  };
});

import { toast as mockedToast } from "sonner";
import { appToast } from "@/lib/toast";

describe("appToast.successCelebration", () => {
  it("dispara sonner success com configuracao anti-travamento", () => {
    const result = appToast.successCelebration("Salvo com sucesso", {
      description: "Tudo certo",
    });

    expect(result).toBe("success-toast-id");
    expect(mockedToast.success).toHaveBeenCalledTimes(1);
    expect(mockedToast.custom).not.toHaveBeenCalled();

    const [message, options] = vi.mocked(mockedToast.success).mock.calls[0];

    expect(message).toBe("Salvo com sucesso");
    expect(options).toMatchObject({
      description: "Tudo certo",
      closeButton: false,
      duration: 1800,
      className: "toast-success-fast-exit",
    });
    expect(options?.icon).toBeTruthy();
  });

  it("permite sobrescrever opcoes sem quebrar o fluxo", () => {
    appToast.successCelebration("Atualizado", {
      duration: 2400,
      className: "custom-class",
    });

    const [, options] = vi.mocked(mockedToast.success).mock.calls[0];

    expect(options).toMatchObject({
      closeButton: false,
      duration: 2400,
      className: "custom-class",
    });
  });
});
