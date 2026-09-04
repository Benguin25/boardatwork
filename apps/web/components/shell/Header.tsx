"use client";

import { useState } from "react";
import { useShellStore } from "@/lib/shell-store";
import { disguiseRegistry } from "@/skins/registry";
import { DisguisePicker } from "./DisguisePicker";

/**
 * The shell header: the "Board at Work" wordmark, the disguise picker (in
 * both modes) and the mode toggle. It belongs to the home page — on a game
 * page the skin's own chrome is the header, showing the game's wordmark in
 * Play mode and the app it is imitating in Work mode.
 */
export function Header(): React.ReactElement {
  const mode = useShellStore((s) => s.mode);
  const disguise = useShellStore((s) => s.disguise);
  const toggleMode = useShellStore((s) => s.toggleMode);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <header className="mx-auto flex max-w-[1100px] items-center justify-between border-b border-[var(--ink)] px-5 py-[14px]">
      <h1 className="text-[26px] font-black tracking-[-0.02em]">Board at Work</h1>
      <nav aria-label="Board at Work controls" className="flex gap-[6px]">
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
      </nav>
      {pickerOpen && (
        <DisguisePicker
          onClose={() => {
            setPickerOpen(false);
          }}
        />
      )}
    </header>
  );
}
