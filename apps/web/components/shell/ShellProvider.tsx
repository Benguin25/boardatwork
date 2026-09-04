"use client";

import { useEffect } from "react";
import { useShellStore } from "@/lib/shell-store";
import { getDisguise, playSkin } from "@/skins/registry";

function setFaviconLink(href: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
}

/**
 * Hydrates shell state from `Storage`, binds the global `Esc` mode toggle
 * (SPEC §3.1), and keeps the tab title/favicon in sync with the active
 * disguise. Mounted once near the app root.
 */
export function ShellProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const hydrate = useShellStore((s) => s.hydrate);
  const hydrated = useShellStore((s) => s.hydrated);
  const mode = useShellStore((s) => s.mode);
  const disguise = useShellStore((s) => s.disguise);
  const toggleMode = useShellStore((s) => s.toggleMode);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      // An open modal or menu owns Esc; it closes itself and stops the
      // event before this listener sees it (see `useOverlay`).
      if (useShellStore.getState().overlays > 0) {
        return;
      }
      toggleMode();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toggleMode]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const skin = mode === "work" ? getDisguise(disguise) : playSkin;
    document.title = skin.tabTitle;
    setFaviconLink(skin.faviconHref);
  }, [hydrated, mode, disguise]);

  return <>{children}</>;
}
