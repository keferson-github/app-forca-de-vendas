"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)
  const [rotationTurns, setRotationTurns] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

    const applyTheme = () => {
      const newTheme = !isDark
      setRotationTurns((current) => current + 1)
      setIsDark(newTheme)
      document.documentElement.classList.toggle("dark")
      localStorage.setItem("theme", newTheme ? "dark" : "light")
    }

    if (typeof document.startViewTransition !== "function") {
      applyTheme()
      return
    }

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme)
    })

    const ready = transition?.ready
    if (ready && typeof ready.then === "function") {
      ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        )
      })
    }
  }, [isDark, duration])

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        className,
        "relative inline-flex h-8 w-14 items-center rounded-full border border-border/70 bg-background/88 p-1 text-foreground shadow-[var(--shadow-soft)] transition-[background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-border hover:bg-background md:h-8 md:w-[3.5rem]",
      )}
      aria-pressed={isDark}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/10 via-transparent to-sky-500/10 dark:from-slate-200/8 dark:to-cyan-400/12" />

      <span className="pointer-events-none relative z-0 flex w-full items-center justify-between px-0.5 text-muted-foreground/80 md:px-0.5">
        <Sun
          className={cn(
            "size-3.5 transition-[transform,opacity,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:size-3.5",
            isDark ? "scale-90 opacity-45" : "scale-100 opacity-100 text-amber-500",
          )}
        />
        <Moon
          className={cn(
            "size-3.5 transition-[transform,opacity,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:size-3.5",
            isDark ? "scale-100 opacity-100 text-sky-500 dark:text-cyan-300" : "scale-90 opacity-45",
          )}
        />
      </span>

      <span
        className={cn(
          "absolute top-1 left-1 z-10 grid size-6 place-items-center rounded-full bg-card text-foreground shadow-[0_10px_25px_-14px_rgba(15,23,42,0.65),0_1px_0_rgba(255,255,255,0.7)_inset] transition-[transform,background-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu will-change-transform dark:bg-slate-900 md:size-6",
          isDark ? "translate-x-6 md:translate-x-5" : "translate-x-0",
        )}
      >
        <span
          className="relative grid size-4 place-items-center overflow-hidden md:size-4"
          style={{ transform: `rotate(${rotationTurns * 180}deg)` }}
        >
          <Sun
            className={cn(
              "absolute size-4 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:size-4",
              isDark ? "rotate-0 scale-100 opacity-100 text-amber-500" : "-rotate-90 scale-75 opacity-0",
            )}
          />
          <Moon
            className={cn(
              "absolute size-4 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:size-4",
              isDark ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100 text-sky-500 dark:text-cyan-300",
            )}
          />
        </span>
      </span>

      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
