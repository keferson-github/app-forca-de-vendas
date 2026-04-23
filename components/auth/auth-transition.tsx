"use client";

import { usePathname } from "next/navigation";

type AuthTransitionProps = {
  children: React.ReactNode;
};

export function AuthTransition({ children }: AuthTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="auth-form-transition w-full max-w-md lg:max-w-[640px]">
      {children}
    </div>
  );
}
