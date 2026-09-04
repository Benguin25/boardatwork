"use client";

import { useState } from "react";
import { useShellStore } from "@/lib/shell-store";
import { getSkin } from "@/skins/registry";
import { DisguisePicker } from "./DisguisePicker";

/** Global shell header: mode toggle + (in Work mode) the disguise picker trigger. */
export function Header(): React.ReactElement {
  const mode = useShellStore((s) => s.mode);
  const skinId = useShellStore((s) => s.skin);
  const toggleMode = useShellStore((s) => s.toggleMode);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 text-sm">
      <span className="font-semibold">Board at Work</span>
      <div className="flex items-center gap-3">
        {mode === "work" && (
          <button type="button" onClick={() => { setPickerOpen(true); }} className="underline-offset-2 hover:underline">
            Disguise: {getSkin(skinId).displayName}
          </button>
        )}
        <button
          type="button"
          onClick={toggleMode}
          aria-pressed={mode === "work"}
          className="rounded-full border border-neutral-400 px-3 py-1"
        >
          {mode === "play" ? "Play" : "Work"} mode (Esc)
        </button>
      </div>
      {pickerOpen && <DisguisePicker onClose={() => { setPickerOpen(false); }} />}
    </header>
  );
}
