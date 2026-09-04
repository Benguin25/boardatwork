"use client";

import { createContext, useContext, useMemo, useState } from "react";

/**
 * Some disguises put the game's feedback, counters and buttons in a side
 * rail (a Docs comment thread, a Slack thread pane) rather than under the
 * puzzle. Games always render `Feedback`/`Passes`/`Actions` in document
 * order; the skin re-homes them into these slots with a portal, so no game
 * ever learns where its controls ended up.
 */
export interface RailSlots {
  feedback: HTMLElement | null;
  passes: HTMLElement | null;
  actions: HTMLElement | null;
}

export const RailContext = createContext<RailSlots | null>(null);

export function useRail(): {
  slots: RailSlots;
  setFeedbackEl: (el: HTMLElement | null) => void;
  setPassesEl: (el: HTMLElement | null) => void;
  setActionsEl: (el: HTMLElement | null) => void;
} {
  const [feedback, setFeedbackEl] = useState<HTMLElement | null>(null);
  const [passes, setPassesEl] = useState<HTMLElement | null>(null);
  const [actions, setActionsEl] = useState<HTMLElement | null>(null);
  const slots = useMemo(
    () => ({ feedback, passes, actions }),
    [feedback, passes, actions],
  );
  return { slots, setFeedbackEl, setPassesEl, setActionsEl };
}

/** `null` inside a modal: nested controls stay where the modal put them. */
export function useRailSlot(name: keyof RailSlots): HTMLElement | null {
  return useContext(RailContext)?.[name] ?? null;
}
