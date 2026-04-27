"use client";

import { LottieToast } from "@/components/shared/lottie-toast";
import successAnimation from "@/public/lottie/successfully.json";

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
      animationData={successAnimation}
      animationSizeClass="size-11"
      tone="success"
      stackedOnMobile={false}
      bareOnMobile={false}
      overlayOnMobile={false}
      onClose={onClose}
    />
  );
}
