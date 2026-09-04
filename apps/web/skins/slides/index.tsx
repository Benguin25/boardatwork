"use client";

import type { ChromeProps, SkinPrimitives } from "@/components/primitives/types";
import { svgFavicon } from "@/lib/favicon";
import { createKitPrimitives } from "../kit";
import { SkinMenu, chromeMenuItems } from "../shared/menu";

/** Slides disguise — see `docs/design/disguises.md` for the chrome checklist. */

const DECK_TITLE = "Q3 platform review";
const MENUS = ["File", "Edit", "View", "Insert", "Format", "Slide", "Arrange"];
const THUMBS = ["Agenda", "Where we are", "Reconciliation", "Risks", "Asks", "Appendix"];
const CURRENT = 3;

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='#F4B400' d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path fill='#FADA80' d='M14 2v6h6z'/><rect x='8' y='12' width='8' height='6' rx='1' fill='#fff'/></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" data-testid="slides-icon">
      <path fill="#F4B400" d="M24 4H10a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3V13z" />
      <path fill="#FADA80" d="M24 4v9h9z" />
      <rect x="13" y="19" width="14" height="9" rx="1" fill="#fff" />
    </svg>
  );
}

function Filmstrip(): React.ReactElement {
  return (
    <aside
      aria-hidden="true"
      data-testid="slides-filmstrip"
      className="hidden w-[168px] flex-none border-r border-[var(--line)] bg-[var(--paper)] px-2 py-3 md:block"
    >
      <ul className="flex flex-col gap-2">
        {THUMBS.map((thumb, i) => (
          <li key={thumb} className="flex items-start gap-1.5">
            <span className="w-3 pt-1 text-right text-[11px] text-[var(--muted)]">{i + 1}</span>
            <span
              className={`flex h-[68px] flex-1 items-center justify-center rounded-sm border bg-white px-1 text-center text-[9px] text-[var(--muted)] ${
                i + 1 === CURRENT ? "border-2 border-[#1a73e8]" : "border-[var(--line)]"
              }`}
            >
              {thumb}
            </span>
          </li>
        ))}
      </ul>
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
    <div data-testid="chrome-slides" className="skin-slides flex min-h-screen flex-col">
      <div className="flex items-start gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-2">
        <Icon className="h-9 w-9 flex-none" />
        <div className="min-w-0 flex-1">
          <h1>
            <button
              type="button"
              onClick={onTitleClick}
              className="max-w-full truncate rounded px-1 text-[17px] font-normal hover:bg-black/5"
            >
              {DECK_TITLE}
            </button>
          </h1>
          <div aria-hidden="true" className="flex gap-0.5" data-testid="slides-menus">
            {MENUS.map((menu) => (
              <span key={menu} className="rounded px-1.5 py-0.5 text-[13px] text-[var(--muted)]">
                {menu}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="rounded bg-[var(--brand)] px-3 py-1.5 text-[13px] font-semibold text-[var(--brand-ink)]"
          >
            Present
          </span>
          <SkinMenu
            triggerLabel="Presentation settings"
            triggerClassName="flex h-8 w-8 items-center justify-center rounded-full bg-[#7b4fbf] text-[13px] font-medium text-white"
            trigger={<span aria-hidden="true">Z</span>}
            items={chromeMenuItems(nav, onChangeDisguise, onExitMode)}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <Filmstrip />
        <div className="flex min-w-0 flex-1 flex-col px-6 py-5">
          <main className="mx-auto w-full max-w-[860px] flex-1 rounded-sm border border-[var(--line)] bg-[var(--paper)] px-12 py-10 shadow-sm">
            <h2 className="mb-1 text-[30px] font-light">Reconciliation</h2>
            <p className="mb-6 text-[13px] text-[var(--muted)]">
              {[meta, subtitle].filter(Boolean).join(" · ")}
            </p>
            {notice !== undefined && (
              <p className="mb-4 border-l-4 border-[var(--brand)] bg-[var(--accent-a)] px-3 py-2 text-sm">
                {notice}
              </p>
            )}
            {children}
          </main>
          <div className="mx-auto mt-3 w-full max-w-[860px] rounded-sm border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-[13px] text-[var(--muted)]">
            Click to add speaker notes
          </div>
          <p aria-hidden="true" className="mt-2 text-[12px] text-[var(--muted)]">
            {CURRENT} of {THUMBS.length}
          </p>
        </div>
        <aside
          aria-hidden="true"
          className="hidden w-[180px] flex-none border-l border-[var(--line)] bg-[var(--paper)] px-3 py-4 text-[13px] text-[var(--muted)] lg:block"
        >
          <p className="mb-2 font-semibold text-[var(--ink)]">Themes</p>
          <p className="mb-4">Simple Light</p>
          <p className="mb-2 font-semibold text-[var(--ink)]">Transition</p>
          <p>Fade · Medium</p>
        </aside>
      </div>
    </div>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-slides" className="skin-slides flex min-h-screen flex-col">
      <div className="flex items-start gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-2">
        <Icon className="h-9 w-9 flex-none" />
        <div className="min-w-0 flex-1">
          <h1>
            <button
              type="button"
              onClick={onExit}
              className="max-w-full truncate rounded px-1 text-[17px] font-normal hover:bg-black/5"
            >
              {DECK_TITLE}
            </button>
          </h1>
          <div aria-hidden="true" className="flex gap-0.5">
            {MENUS.map((menu) => (
              <span key={menu} className="rounded px-1.5 py-0.5 text-[13px] text-[var(--muted)]">
                {menu}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <Filmstrip />
        <div className="flex min-w-0 flex-1 flex-col px-6 py-5">
          <div className="mx-auto w-full max-w-[860px] flex-1 rounded-sm border border-[var(--line)] bg-[var(--paper)] px-12 py-10 shadow-sm">
            <h2 className="mb-6 text-[30px] font-light">Where we are</h2>
            <ul className="list-disc pl-6 text-[18px] leading-relaxed">
              <li>Roadmap review moved to Thursday</li>
              <li>Vendor renewal with legal, back end of week</li>
              <li>Onboarding rewrite 70% complete</li>
            </ul>
            <p className="mt-10 text-[13px] text-[var(--muted)]">
              Click the deck name to return.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const slidesSkin: SkinPrimitives = {
  id: "slides",
  displayName: "Slides",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: `${DECK_TITLE} - Google Slides`,
  Chrome,
  Cover,
  ...createKitPrimitives({ variant: "tile", idPrefix: "slides" }),
};
