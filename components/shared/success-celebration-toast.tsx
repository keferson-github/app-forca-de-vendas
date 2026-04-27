"use client";

import { LottieToast } from "@/components/shared/lottie-toast";

type SuccessCelebrationToastProps = {
  title: string;
  description?: string;
  onClose: () => void;
};

export function SuccessCelebrationToast({
  title,
  description,
  onClose,
}: SuccessCelebrationToastProps) {
  return (
    <LottieToast
      title={title}
      description={description}
      animationPath="/lottie/successfully.json"
      tone="success"
      stackedOnMobile
      bareOnMobile
      overlayOnMobile
      onClose={onClose}
    />
  );
}
