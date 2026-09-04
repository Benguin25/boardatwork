"use client";

import Link from "next/link";
import { useState } from "react";
import { useShellStore } from "@/lib/shell-store";
import { disguiseRegistry } from "@/skins/registry";
import { DisguisePicker } from "./DisguisePicker";

/**
 * The shell header. It carries the "Board at Work" wordmark, the disguise
 * picker (in both modes) and the mode toggle — so it belongs to the home
 * page, not to a game page, where the skin's own chrome is the header
 * (the Play skin shows the game's wordmark, a Work skin shows the app it
 * is imitating).
 */
export function Header(): React.ReactElement {
  const mode = useShellStore((s) => s.mode);
  const disguise = useShellStore((s) => s.disguise);
  const toggleMode = useShellStore((s) => s.toggleMode);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <nav
      aria-label="Board at Work controls"
      className="mx-auto flex max-w-[1100px] items-center justify-between border-b border-[var(--ink)] px-5 py-[14px]"
    >
      <Link href="/" className="text-[26px] font-black leading-none tracking-[-0.02em]">
        Board at Work
      </Link>
      <div className="flex items-center gap-[6px]">
        <button
          type="button"
          onClick={() => {
            setPickerOpen(true);
          }}
          className="rounded-[6px] px-[10px] py-[8px] text-[14px] font-medium hover:bg-[#f0f0f0]"
        >
          Disguise: {disguiseRegistry[disguise].displayName}
        </button>
        <button
          type="button"
          onClick={toggleMode}
          aria-pressed={mode === "work"}
          className="rounded-[6px] px-[10px] py-[8px] text-[14px] font-medium hover:bg-[#f0f0f0]"
        >
          {mode === "play" ? "Play" : "Work"} mode (Esc)
        </button>
      </div>
      {pickerOpen && (
        <DisguisePicker
          onClose={() => {
            setPickerOpen(false);
          }}
        />
      )}
    </nav>
  );
}
