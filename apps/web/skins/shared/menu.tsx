"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOverlay } from "@/components/shell/use-overlay";

export interface SkinMenuItem {
  id: string;
  label: string;
  onClick: () => void;
}

/**
 * The small "settings" dropdown every Work disguise hangs its shell
 * actions off (SPEC §3.1: the disguise picker lives in Work-mode
 * settings). Each skin supplies its own trigger, so the menu looks native
 * to whichever app is being imitated.
 */
export function SkinMenu({
  triggerLabel,
  triggerClassName,
  trigger,
  items,
  align = "right",
}: {
  triggerLabel: string;
  triggerClassName: string;
  trigger: React.ReactNode;
  items: readonly SkinMenuItem[];
  align?: "left" | "right";
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useOverlay(open, close);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        data-testid="skin-settings"
        onClick={() => {
          setOpen((value) => !value);
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <ul
          role="menu"
          aria-label={triggerLabel}
          className={`absolute top-full z-30 mt-1 min-w-[190px] rounded-lg border border-[var(--line)] bg-[var(--paper)] py-1 text-[14px] text-[var(--ink)] shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className="block w-full px-4 py-2 text-left hover:bg-black/5"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The standard contents of a disguise's settings menu: the shell's nav
 * items, "Change disguise", and the way back to Play mode.
 */
export function chromeMenuItems(
  nav: readonly { id: string; label: string; onClick: () => void }[],
  onChangeDisguise: () => void,
  onExitMode: (() => void) | undefined,
): readonly SkinMenuItem[] {
  return [
    ...nav.map((item) => ({ id: item.id, label: item.label, onClick: item.onClick })),
    { id: "change-disguise", label: "Change disguise", onClick: onChangeDisguise },
    ...(onExitMode ? [{ id: "exit", label: "Back to Play mode", onClick: onExitMode }] : []),
  ];
}
