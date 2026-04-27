"use client";

import { memo, useEffect, useRef, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import { Player } from "@lottiefiles/react-lottie-player";
import successAnimation from "@/public/lottie/successfully.json";

const FALLBACK_TIMEOUT_MS = 900;
const ICON_SIZE_PX = 28;
const PREVIEW_FRAME = 30;

function StaticSuccessIcon() {
  return <CircleCheckBig className="size-7 text-emerald-400" aria-hidden />;
}

export const SuccessLottieIcon = memo(function SuccessLottieIcon() {
  const playerRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!ready) {
        setFailed(true);
      }
    }, FALLBACK_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [ready]);

  if (failed) {
    return <StaticSuccessIcon />;
  }

  return (
    <div className="grid size-8 shrink-0 place-items-center overflow-hidden" aria-hidden>
      <Player
        ref={playerRef}
        autoplay={false}
        loop={false}
        renderer="svg"
        src={successAnimation}
        onEvent={(event) => {
          if (event === "error") {
            setFailed(true);
            return;
          }

          if (event === "ready") {
            try {
              playerRef.current?.setSeeker(PREVIEW_FRAME, false);
            } catch {
              // Keep rendering resilient if player API changes.
            }
          }

          if (event === "load" || event === "ready" || event === "play") {
            setReady(true);
          }
        }}
        className="success-lottie-player"
        style={{ width: `${ICON_SIZE_PX}px`, height: `${ICON_SIZE_PX}px` }}
      />
    </div>
  );
});
