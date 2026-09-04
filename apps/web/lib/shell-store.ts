"use client";

import { create } from "zustand";
import { getStorage } from "./storage";

export type ShellMode = "play" | "work";

interface ShellState {
  mode: ShellMode;
  skin: string;
  covered: boolean;
  hydrated: boolean;
  hydrate: () => void;
  setSkin: (skin: string) => void;
  /** SPEC §3.1: Esc toggles Play <-> Work; Work always opens already covered. */
  toggleMode: () => void;
  /** SPEC §3.1: clicking the document title flips the cover state. */
  toggleCovered: () => void;
}

function persist(mode: ShellMode, skin: string): void {
  void getStorage().saveSettings({ mode, skin });
}

export const useShellStore = create<ShellState>((set, get) => ({
  mode: "play",
  skin: "play",
  covered: false,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) {
      return;
    }
    void getStorage()
      .getSettings()
      .then((settings) => {
        set({
          mode: settings.mode,
          skin: settings.skin,
          covered: settings.mode === "work",
          hydrated: true,
        });
      });
  },
  setSkin: (skin) => {
    set({ skin });
    persist(get().mode, skin);
  },
  toggleMode: () => {
    const nextMode: ShellMode = get().mode === "play" ? "work" : "play";
    set({ mode: nextMode, covered: nextMode === "work" });
    persist(nextMode, get().skin);
  },
  toggleCovered: () => {
    set((state) => ({ covered: !state.covered }));
  },
}));
