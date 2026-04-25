"use client";

import { usePathname } from "next/navigation";

type AuthTransitionProps = {
  children: React.ReactNode;
};

let lastSeenPathname: string | null = null;

export function AuthTransition({ children }: AuthTransitionProps) {
  const pathname = usePathname();
  const direction =
    lastSeenPathname && lastSeenPathname !== pathname
      ? pathname === "/register"
        ? "forward"
        : "backward"
      : "initial";
  lastSeenPathname = pathname;

  return (
    <div
      key={pathname}
      data-direction={direction}
      className="auth-form-transition auth-mobile-panel mx-auto flex w-full max-w-[460px] flex-col lg:max-w-[640px]"
    >
      <div className="auth-mobile-grabber mx-auto shrink-0 lg:hidden" />
      <div className="auth-form-stage flex-1">{children}</div>
    </div>
  );
}
