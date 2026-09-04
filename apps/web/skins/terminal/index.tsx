"use client";

import type { ChromeProps, SkinPrimitives } from "@/components/primitives/types";
import { svgFavicon } from "@/lib/favicon";
import { createKitPrimitives } from "../kit";
import { SkinMenu, chromeMenuItems } from "../shared/menu";

/** Terminal disguise — see `docs/design/disguises.md` for the chrome checklist. */

const WINDOW_TITLE = "zsh — 120×32";
const PROMPT = "zach@northwind ~/platform %";
const TABS = ["platform", "logs"];

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='4' fill='#0C0F0C'/><path stroke='#33CC66' stroke-width='2' fill='none' d='m6 8 4 4-4 4M12.5 16H18'/></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" data-testid="terminal-icon">
      <rect width="24" height="24" rx="4" fill="#0C0F0C" />
      <path stroke="#33CC66" strokeWidth="2" fill="none" d="m6 8 4 4-4 4M12.5 16H18" />
    </svg>
  );
}

function TitleBar({
  label,
  onTitleClick,
  menu,
}: {
  label: string;
  onTitleClick: (() => void) | undefined;
  menu?: React.ReactNode;
}): React.ReactElement {
  return (
    <header>
      <div className="flex items-center gap-2 rounded-t-lg bg-[#1b201b] px-3 py-2">
        <Icon className="h-4 w-4 flex-none" />
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <h1 className="flex-1 text-center">
          <button
            type="button"
            onClick={onTitleClick}
            className="rounded px-2 text-[12px] text-[var(--muted)] hover:bg-white/5"
          >
            {label}
          </button>
        </h1>
        {menu}
      </div>
      <div
        aria-hidden="true"
        data-testid="terminal-tabs"
        className="flex gap-px bg-[#141814] px-2 text-[12px]"
      >
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={`px-3 py-1 ${i === 0 ? "bg-[var(--paper)] text-[var(--ink)]" : "text-[var(--muted)]"}`}
          >
            {tab}
          </span>
        ))}
      </div>
    </header>
  );
}

function Chrome({
  meta,
  subtitle,
  notice,
  nav,
  onTitleClick,
  onChangeDisguise,
  onExitMode,
  children,
}: ChromeProps): React.ReactElement {
  return (
    <div data-testid="chrome-terminal" className="skin-terminal min-h-screen p-4 text-[13px]">
      <div className="mx-auto max-w-[980px] overflow-hidden rounded-lg border border-[var(--line)]">
        <TitleBar
          label={WINDOW_TITLE}
          onTitleClick={onTitleClick}
          menu={
            <SkinMenu
              triggerLabel="Terminal settings"
              triggerClassName="rounded px-2 py-0.5 text-[12px] text-[var(--muted)] hover:bg-white/5"
              trigger={<span aria-hidden="true">⌄</span>}
              items={chromeMenuItems(nav, onChangeDisguise, onExitMode)}
            />
          }
        />
        <main className="bg-[var(--paper)] px-4 py-3 leading-6">
          <p aria-hidden="true" data-testid="terminal-prompt" className="text-[var(--muted)]">
            <span className="text-[var(--brand)]">{PROMPT}</span> ./reconcile --watch
          </p>
          <p aria-hidden="true" className="text-[var(--muted)]">
            loaded {[meta, subtitle].filter(Boolean).join(" · ")}
          </p>
          {notice !== undefined && (
            <p className="my-2 border-l-2 border-[var(--brand)] pl-3">{notice}</p>
          )}
          <div className="my-3">{children}</div>
          <p aria-hidden="true">
            <span className="text-[var(--brand)]">{PROMPT}</span>{" "}
            <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[var(--ink)] align-middle" />
          </p>
        </main>
        <footer
          aria-hidden="true"
          data-testid="terminal-status"
          className="flex justify-between border-t border-[var(--line)] bg-[#141814] px-4 py-1 text-[11px] text-[var(--muted)]"
        >
          <span>[c] check · [h] hint · [q] quit</span>
          <span>exit 0 · 0.41s</span>
        </footer>
      </div>
    </div>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-terminal" className="skin-terminal min-h-screen p-4 text-[13px]">
      <div className="mx-auto max-w-[980px] overflow-hidden rounded-lg border border-[var(--line)]">
        <TitleBar label={WINDOW_TITLE} onTitleClick={onExit} />
        <main className="bg-[var(--paper)] px-4 py-3 leading-6">
          {[
            "npm run build",
            "> @northwind/platform@2.14.0 build",
            "> next build",
            "",
            "  ▲ compiled successfully in 8.2s",
            "  ✓ 42 static pages generated",
            "  ✓ 0 type errors",
          ].map((line, i) => (
            <p key={i} className={i === 0 ? "text-[var(--brand)]" : "text-[var(--muted)]"}>
              {i === 0 ? `${PROMPT} ${line}` : line}
            </p>
          ))}
          <p className="mt-4 text-[var(--muted)]">Click the window title to return.</p>
        </main>
      </div>
    </div>
  );
}

export const terminalSkin: SkinPrimitives = {
  id: "terminal",
  displayName: "Terminal",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: WINDOW_TITLE,
  Chrome,
  Cover,
  ...createKitPrimitives({ variant: "mono", idPrefix: "terminal" }),
};
