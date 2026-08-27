"use client";

import { useEffect, useRef } from "react";

/**
 * A soft, accent-colored radial glow that follows the cursor. Purely
 * decorative (aria-hidden, pointer-events-none) — updates a CSS custom
 * property directly via a ref rather than React state, so mouse movement
 * never triggers a re-render. Skips itself entirely on touch devices
 * (no meaningful cursor to follow) and when the user prefers reduced motion.
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = glowRef.current;
    if (!el) return;

    function handleMove(event: MouseEvent) {
      el!.style.setProperty("--glow-x", `${event.clientX}px`);
      el!.style.setProperty("--glow-y", `${event.clientY}px`);
      el!.style.opacity = "1";
    }

    function handleLeave() {
      el!.style.opacity = "0";
    }

    window.addEventListener("mousemove", handleMove);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 opacity-0 transition-opacity duration-300"
      style={{
        background:
          "radial-gradient(200px circle at var(--glow-x, 10%) var(--glow-y, 10%), color-mix(in srgb, var(--accent) 15%, transparent), transparent 50%)",
      }}
    />
  );
}
