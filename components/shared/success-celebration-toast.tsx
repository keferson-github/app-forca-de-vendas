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
      animationSizeClass="size-[4.5rem]"
      tone="success"
      centered
      stackedOnMobile
      bareOnMobile
      overlayOnMobile
      onClose={onClose}
    />
  );
}
