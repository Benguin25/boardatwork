"use client";

import { useEffect, useRef } from "react";
import { useShellStore } from "@/lib/shell-store";

/**
 * Registers an open modal/menu with the shell so the global `Esc` handler
 * stands down, and closes this overlay on `Esc` instead. Mirrors the
 * prototype: `Esc` closes what is open before it toggles modes.
 *
 * `onClose` is held in a ref so a caller passing an inline arrow (the
 * normal case) doesn't re-register the overlay on every render — which
 * would push/pop shell state in a loop.
 */
export function useOverlay(open: boolean, onClose: () => void): void {
  const pushOverlay = useShellStore((s) => s.pushOverlay);
  const popOverlay = useShellStore((s) => s.popOverlay);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    pushOverlay();
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      popOverlay();
    };
  }, [open, pushOverlay, popOverlay]);
}
