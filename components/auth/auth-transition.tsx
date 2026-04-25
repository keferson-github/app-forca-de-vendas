"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

type AuthTransitionProps = {
  children: React.ReactNode;
};

export function AuthTransition({ children }: AuthTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.96, y: 10, filter: "blur(12px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.98, y: -10, filter: "blur(12px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md lg:max-w-[640px]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
