"use client";

import { create } from "zustand";
import { DEFAULT_DISGUISE, resolveDisguise, type DisguiseId } from "./disguises";
import { getStorage } from "./storage";

export type ShellMode = "play" | "work";

interface ShellState {
  mode: ShellMode;
  /** Which of the eight Work-mode disguises is active (never `"play"`). */
  disguise: DisguiseId;
  covered: boolean;
  nickname: string | undefined;
  hydrated: boolean;
  /**
   * How many modals/menus are open. `Esc` belongs to the topmost overlay
   * while any is open, and only toggles Play/Work when none is.
   */
  overlays: number;
  hydrate: () => void;
  setDisguise: (disguise: DisguiseId) => void;
  setMode: (mode: ShellMode) => void;
  /** SPEC §3.1: Esc toggles Play <-> Work; Work always opens already covered. */
  toggleMode: () => void;
  /** SPEC §3.1: clicking the document title flips the cover state. */
  toggleCovered: () => void;
  setNickname: (nickname: string) => void;
  pushOverlay: () => void;
  popOverlay: () => void;
}

export const useShellStore = create<ShellState>((set, get) => {
  function persist(): void {
    const { mode, disguise, nickname } = get();
    void getStorage().saveSettings(
      nickname === undefined || nickname === ""
        ? { mode, skin: disguise }
        : { mode, skin: disguise, nickname },
    );
  }

  return {
    mode: "play",
    disguise: DEFAULT_DISGUISE,
    covered: false,
    nickname: undefined,
    hydrated: false,
    overlays: 0,
    hydrate: () => {
      if (get().hydrated) {
        return;
      }
      void getStorage()
        .getSettings()
        .then((settings) => {
          set({
            mode: settings.mode,
            // Boundary validation: a stale or hand-edited value (including
            // the legacy `"play"`) resolves to a real disguise instead of
            // rendering nothing (ADR-0006).
            disguise: resolveDisguise(settings.skin),
            covered: settings.mode === "work",
            nickname: settings.nickname,
            hydrated: true,
          });
        });
    },
    setDisguise: (disguise) => {
      set({ disguise });
      persist();
    },
    setMode: (mode) => {
      set({ mode, covered: mode === "work" });
      persist();
    },
    toggleMode: () => {
      const nextMode: ShellMode = get().mode === "play" ? "work" : "play";
      set({ mode: nextMode, covered: nextMode === "work" });
      persist();
    },
    toggleCovered: () => {
      set((state) => ({ covered: !state.covered }));
    },
    setNickname: (nickname) => {
      set({ nickname });
      persist();
    },
    pushOverlay: () => {
      set((state) => ({ overlays: state.overlays + 1 }));
    },
    popOverlay: () => {
      set((state) => ({ overlays: Math.max(0, state.overlays - 1) }));
    },
  };
});
