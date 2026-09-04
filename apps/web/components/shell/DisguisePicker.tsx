"use client";

import { useShellStore } from "@/lib/shell-store";
import { SKIN_IDS, skinRegistry } from "@/skins/registry";

/** SPEC §3.1: Work-mode settings — pick which of the nine disguises to render games in. */
export function DisguisePicker({ onClose }: { onClose: () => void }): React.ReactElement {
  const skinId = useShellStore((s) => s.skin);
  const setSkin = useShellStore((s) => s.setSkin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disguise-picker-title"
        className="w-full max-w-sm rounded-lg border border-neutral-300 bg-white p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="disguise-picker-title" className="text-lg font-bold">
            Choose a disguise
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none">
            ×
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-2">
          {SKIN_IDS.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  setSkin(id);
                  onClose();
                }}
                aria-pressed={skinId === id}
                className={`flex w-full flex-col items-center gap-1 rounded border p-3 text-sm ${
                  skinId === id ? "border-black font-semibold" : "border-neutral-300"
                }`}
              >
                <span aria-hidden="true" className="text-xl">
                  {skinRegistry[id].favicon}
                </span>
                {skinRegistry[id].displayName}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
