"use client";

import { useEffect } from "react";
import { emojiFavicon } from "@/lib/favicon";
import { useShellStore } from "@/lib/shell-store";
import { getSkin } from "@/skins/registry";

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
  const skinId = useShellStore((s) => s.skin);
  const toggleMode = useShellStore((s) => s.toggleMode);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        toggleMode();
      }
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
    if (mode === "work") {
      const skin = getSkin(skinId);
      document.title = `${skin.displayName} — Board at Work`;
      setFaviconLink(emojiFavicon(skin.favicon));
    } else {
      document.title = "Board at Work";
      setFaviconLink(emojiFavicon("🎮"));
    }
  }, [hydrated, mode, skinId]);

  return <>{children}</>;
}
