"use client";

import type {
  ChromeNavItem,
  ChromeProps,
  SkinPrimitives,
} from "@/components/primitives/types";
import { svgFavicon } from "@/lib/favicon";
import { createKitPrimitives } from "../kit";
import { SkinMenu, chromeMenuItems } from "../shared/menu";

/** Notion disguise — see `docs/design/disguises.md` for the chrome checklist. */

const PAGE_TITLE = "Weekly reconciliation";
const PAGE_EMOJI = "🗂";
const TREE = [
  { emoji: "🏠", name: "Team home" },
  { emoji: "🗂", name: PAGE_TITLE },
  { emoji: "📌", name: "Decisions log" },
  { emoji: "🧭", name: "Onboarding" },
  { emoji: "💬", name: "Meeting notes" },
];

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='4' fill='#fff' stroke='#37352F' stroke-width='1.5'/><path fill='#37352F' d='M8 7h1.8l4.4 6.2V7H16v10h-1.8L9.8 10.7V17H8z'/></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" data-testid="notion-icon">
      <rect x="0.75" y="0.75" width="22.5" height="22.5" rx="4" fill="#fff" stroke="#37352F" strokeWidth="1.5" />
      <path fill="#37352F" d="M8 7h1.8l4.4 6.2V7H16v10h-1.8L9.8 10.7V17H8z" />
    </svg>
  );
}

function Sidebar({
  nav,
  onChangeDisguise,
  onExitMode,
}: {
  nav: readonly ChromeNavItem[];
  onChangeDisguise: () => void;
  onExitMode: (() => void) | undefined;
}): React.ReactElement {
  return (
    <aside
      data-testid="notion-sidebar"
      className="hidden w-[230px] flex-none flex-col bg-[var(--sidebar)] px-2 py-3 text-[14px] md:flex"
    >
      <div className="mb-3 flex items-center gap-2 px-2">
        <span className="flex-1 truncate font-semibold">Northwind wiki</span>
        <SkinMenu
          triggerLabel="Workspace settings"
          triggerClassName="flex h-6 w-6 items-center justify-center rounded bg-[#b8b0a4] text-[11px] font-bold text-white"
          trigger={<span aria-hidden="true">Z</span>}
          align="left"
          items={chromeMenuItems(nav, onChangeDisguise, onExitMode)}
        />
      </div>
      <ul aria-hidden="true" className="mb-4 text-[var(--muted)]">
        <li className="rounded px-2 py-1">Search</li>
        <li className="rounded px-2 py-1">Home</li>
        <li className="rounded px-2 py-1">Inbox</li>
      </ul>
      <p aria-hidden="true" className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Private
      </p>
      <ul aria-hidden="true">
        {TREE.map((page) => (
          <li
            key={page.name}
            className={`truncate rounded px-2 py-1 ${
              page.name === PAGE_TITLE ? "bg-black/5 font-medium" : ""
            }`}
          >
            <span className="mr-1.5">{page.emoji}</span>
            {page.name}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onChangeDisguise}
        className="mt-auto rounded px-2 py-1 text-left text-[var(--muted)] hover:bg-black/5"
      >
        + New page
      </button>
    </aside>
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
    <div data-testid="chrome-notion" className="skin-notion flex min-h-screen">
      <Sidebar nav={nav} onChangeDisguise={onChangeDisguise} onExitMode={onExitMode} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 px-6 py-2 text-[13px] text-[var(--muted)]">
          <span aria-hidden="true">Northwind wiki / {PAGE_TITLE}</span>
          <span aria-hidden="true" className="ml-auto" data-testid="notion-meta">
            Share · Comments · Updates · ☆ · …
          </span>
        </div>
        <div aria-hidden="true" className="h-[100px] bg-[var(--accent-a)]" />
        <main className="mx-auto w-full max-w-[720px] px-6 pb-16">
          <p aria-hidden="true" className="-mt-8 mb-2 text-[52px] leading-none">
            {PAGE_EMOJI}
          </p>
          <h1 className="mb-1">
            <button
              type="button"
              onClick={onTitleClick}
              className="rounded px-1 text-left text-[38px] font-bold leading-tight hover:bg-black/5"
            >
              {PAGE_TITLE}
            </button>
          </h1>
          <p className="mb-6 text-[13px] text-[var(--muted)]">
            {[meta, subtitle].filter(Boolean).join(" · ")}
          </p>
          <div className="mb-6 flex gap-3 rounded-md bg-[var(--accent-c)] px-4 py-3 text-[15px]">
            <span aria-hidden="true">💡</span>
            <p>{notice ?? "Reviewed weekly. Blocks below are filled in during the pass."}</p>
          </div>
          <div className="text-[16px] leading-[1.65]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-notion" className="skin-notion flex min-h-screen">
      <aside className="hidden w-[230px] flex-none flex-col bg-[var(--sidebar)] px-2 py-3 text-[14px] md:flex">
        <span className="mb-3 px-2 font-semibold">Northwind wiki</span>
        <ul>
          {TREE.map((page) => (
            <li key={page.name} className="truncate rounded px-2 py-1">
              <span className="mr-1.5">{page.emoji}</span>
              {page.name}
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div aria-hidden="true" className="h-[100px] bg-[var(--accent-a)]" />
        <main className="mx-auto w-full max-w-[720px] px-6 pb-16 text-[16px] leading-[1.65]">
          <p aria-hidden="true" className="-mt-8 mb-2 text-[52px] leading-none">
            {PAGE_EMOJI}
          </p>
          <h1 className="mb-4">
            <button
              type="button"
              onClick={onExit}
              className="rounded px-1 text-left text-[38px] font-bold leading-tight hover:bg-black/5"
            >
              {PAGE_TITLE}
            </button>
          </h1>
          <p className="mb-3">
            The reconciliation runs every Thursday. Owners confirm their figures the day
            before; anything unresolved is carried to the following week.
          </p>
          <ul className="mb-6 list-disc pl-6">
            <li>Roadmap review moved to Thursday</li>
            <li>Vendor renewal with legal</li>
            <li>Onboarding rewrite 70% complete</li>
          </ul>
          <p className="text-[13px] text-[var(--muted)]">Click the page title to return.</p>
        </main>
      </div>
    </div>
  );
}

export const notionSkin: SkinPrimitives = {
  id: "notion",
  displayName: "Notion",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: `${PAGE_TITLE} - Notion`,
  Chrome,
  Cover,
  ...createKitPrimitives({ variant: "highlight", idPrefix: "notion" }),
};
