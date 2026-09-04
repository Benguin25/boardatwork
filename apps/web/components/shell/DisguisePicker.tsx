"use client";

import { useEffect, useRef } from "react";
import { DISGUISE_IDS, type DisguiseId } from "@/lib/disguises";
import { useShellStore } from "@/lib/shell-store";
import { disguiseRegistry } from "@/skins/registry";
import { useOverlay } from "./use-overlay";

/**
 * SPEC §3.1 disguise picker. Reachable from the shell header in both
 * modes, and from the "Change disguise" item every Work chrome carries.
 * Picking a disguise also enters Work mode, so it doubles as the Play
 * skin's "Work mode" control.
 */
export function DisguisePicker({ onClose }: { onClose: () => void }): React.ReactElement {
  const disguise = useShellStore((s) => s.disguise);
  const mode = useShellStore((s) => s.mode);
  const setDisguise = useShellStore((s) => s.setDisguise);
  const setMode = useShellStore((s) => s.setMode);
  const cardRef = useRef<HTMLDivElement>(null);

  useOverlay(true, onClose);

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  function choose(id: DisguiseId): void {
    setDisguise(id);
    if (mode !== "work") {
      setMode("work");
    }
    onClose();
  }

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="disguise-picker-title"
        data-testid="disguise-picker"
        className="skin-play max-h-[92vh] w-[440px] max-w-full overflow-auto rounded-[10px] bg-white px-7 pb-7 pt-9 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-[10px] top-[10px] px-[10px] py-[6px] text-[22px] leading-none"
        >
          ×
        </button>
        <h2 id="disguise-picker-title" className="mb-2 text-[28px] font-black tracking-[-0.02em]">
          Choose a disguise
        </h2>
        <p className="mb-4 text-[15px] leading-[1.5] text-[var(--muted)]">
          Work mode hides the puzzle inside one of these. Esc switches back.
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DISGUISE_IDS.map((id) => {
            const skin = disguiseRegistry[id];
            const active = disguise === id && mode === "work";
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    choose(id);
                  }}
                  aria-pressed={active}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-[6px] border px-2 py-3 text-[13px] ${
                    active
                      ? "border-2 border-[var(--ink)] font-semibold"
                      : "border-[var(--line)]"
                  }`}
                >
                  <skin.Icon className="h-6 w-6" />
                  {skin.displayName}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
