"use client";

import type { ChromeProps, SkinPrimitives } from "@/components/primitives/types";
import { svgFavicon } from "@/lib/favicon";
import { createKitPrimitives } from "../kit";
import { SkinMenu, chromeMenuItems } from "../shared/menu";
import { RailContext, useRail } from "../shared/rail";

/** Jira disguise — see `docs/design/disguises.md` for the chrome checklist. */

const BOARD = "Platform board";
const ISSUE_KEY = "PLAT-214";
const SIDEBAR = ["Backlog", "Board", "Reports", "Issues"];
const COLUMNS = [
  {
    name: "To do",
    cards: [
      { key: "PLAT-231", summary: "Retire the legacy export job", label: "Chore", points: 3 },
      { key: "PLAT-244", summary: "Rate-limit the webhook fan-out", label: "Bug", points: 5 },
    ],
  },
  {
    name: "In progress",
    cards: [{ key: ISSUE_KEY, summary: "Reconcile stream assignment", label: "Task", points: 8 }],
  },
  {
    name: "In review",
    cards: [{ key: "PLAT-198", summary: "Split the billing permissions doc", label: "Task", points: 2 }],
  },
  { name: "Done", cards: [{ key: "PLAT-176", summary: "Upgrade the runner image", label: "Chore", points: 1 }] },
];

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='#0052CC' d='M12 2 3 11h6.5A5.5 5.5 0 0 0 15 16.5V13z'/><path fill='#2684FF' d='M12 22l9-9h-6.5A5.5 5.5 0 0 0 9 7.5V11z'/></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" data-testid="jira-icon">
      <path fill="#0052CC" d="M12 2 3 11h6.5A5.5 5.5 0 0 0 15 16.5V13z" />
      <path fill="#2684FF" d="M12 22l9-9h-6.5A5.5 5.5 0 0 0 9 7.5V11z" />
    </svg>
  );
}

function Card({
  card,
}: {
  card: { key: string; summary: string; label: string; points: number };
}): React.ReactElement {
  return (
    <li className="rounded border border-[var(--line)] bg-[var(--paper)] p-2.5 text-[13px] shadow-sm">
      <p className="mb-1.5">{card.summary}</p>
      <span className="rounded-sm bg-[var(--accent-c)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--accent-c-lock)]">
        {card.label}
      </span>
      <p className="mt-2 flex items-center gap-2 text-[12px] text-[var(--muted)]">
        <span className="font-semibold">{card.key}</span>
        <span className="ml-auto rounded-full bg-[var(--line)] px-1.5 font-semibold">
          {card.points}
        </span>
        <span
          aria-hidden="true"
          className="h-5 w-5 rounded-full bg-[#8777d9] text-center text-[10px] font-bold leading-5 text-white"
        >
          Z
        </span>
      </p>
    </li>
  );
}

function Board(): React.ReactElement {
  return (
    <div aria-hidden="true" data-testid="jira-columns" className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((column) => (
        <div key={column.name} className="w-[210px] flex-none rounded bg-[#ebecf0] p-2">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            {column.name} <span className="ml-1">{column.cards.length}</span>
          </p>
          <ul className="flex flex-col gap-2">
            {column.cards.map((card) => (
              <Card key={card.key} card={card} />
            ))}
          </ul>
        </div>
      ))}
    </div>
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
  const { slots, setFeedbackEl, setPassesEl, setActionsEl } = useRail();

  return (
    <div data-testid="chrome-jira" className="skin-jira flex min-h-screen flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-2">
        <Icon className="h-6 w-6 flex-none" />
        <span aria-hidden="true" className="text-[13px] text-[var(--muted)]">
          Platform / Board
        </span>
        <span
          aria-hidden="true"
          className="ml-auto rounded border border-[var(--line)] px-3 py-1 text-[13px] text-[var(--muted)]"
        >
          Search
        </span>
        <span
          aria-hidden="true"
          className="rounded bg-[var(--brand)] px-3 py-1 text-[13px] font-semibold text-[var(--brand-ink)]"
        >
          Create
        </span>
        <SkinMenu
          triggerLabel="Board settings"
          triggerClassName="flex h-7 w-7 items-center justify-center rounded-full bg-[#8777d9] text-[12px] font-bold text-white"
          trigger={<span aria-hidden="true">Z</span>}
          items={chromeMenuItems(nav, onChangeDisguise, onExitMode)}
        />
      </div>
      <div className="flex min-h-0 flex-1">
        <nav
          aria-hidden="true"
          data-testid="jira-sidebar"
          className="hidden w-[180px] flex-none border-r border-[var(--line)] bg-[var(--paper)] px-3 py-4 text-[13px] md:block"
        >
          <p className="mb-3 font-semibold">Platform</p>
          <ul className="flex flex-col gap-1">
            {SIDEBAR.map((item) => (
              <li
                key={item}
                className={`rounded px-2 py-1 ${
                  item === "Board" ? "bg-[var(--accent-c)] font-semibold" : "text-[var(--muted)]"
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1 px-4 py-4">
          <h1 className="mb-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onTitleClick}
              className="rounded px-1 text-[20px] font-semibold hover:bg-black/5"
            >
              {BOARD}
            </button>
            <span aria-hidden="true" className="flex gap-1">
              {["Z", "P", "S"].map((initial) => (
                <span
                  key={initial}
                  className="h-6 w-6 rounded-full border-2 border-white bg-[#8777d9] text-center text-[11px] font-bold leading-5 text-white"
                >
                  {initial}
                </span>
              ))}
            </span>
          </h1>
          <Board />
          <div className="mt-4 flex flex-wrap gap-4">
            <main className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--paper)] p-4">
              <p className="mb-1 text-[12px] font-semibold text-[var(--muted)]">
                {ISSUE_KEY} · {[meta, subtitle].filter(Boolean).join(" · ")}
              </p>
              {notice !== undefined && (
                <p className="mb-3 rounded border-l-4 border-[var(--brand)] bg-[var(--accent-c)] px-3 py-2 text-sm">
                  {notice}
                </p>
              )}
              <RailContext.Provider value={slots}>{children}</RailContext.Provider>
            </main>
            <aside
              data-testid="jira-detail"
              className="w-[280px] max-w-full flex-none rounded border border-[var(--line)] bg-[var(--paper)] p-4 text-[13px]"
            >
              <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-[var(--muted)]">Status</dt>
                <dd className="font-semibold">In progress</dd>
                <dt className="text-[var(--muted)]">Assignee</dt>
                <dd className="font-semibold">You</dd>
                <dt className="text-[var(--muted)]">Sprint</dt>
                <dd className="font-semibold">Platform 32</dd>
              </dl>
              <p className="mb-1 font-semibold">Comment</p>
              <div ref={setFeedbackEl} />
              <div ref={setPassesEl} className="mt-1" />
              <div ref={setActionsEl} className="mt-2 flex flex-wrap gap-2" />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-jira" className="skin-jira flex min-h-screen flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-2">
        <Icon className="h-6 w-6 flex-none" />
        <span aria-hidden="true" className="text-[13px] text-[var(--muted)]">
          Platform / Board
        </span>
      </div>
      <div className="flex-1 px-4 py-4">
        <h1 className="mb-3">
          <button
            type="button"
            onClick={onExit}
            className="rounded px-1 text-[20px] font-semibold hover:bg-black/5"
          >
            {BOARD}
          </button>
        </h1>
        <Board />
        <p className="mt-6 text-[13px] text-[var(--muted)]">Click the board name to return.</p>
      </div>
    </div>
  );
}

export const jiraSkin: SkinPrimitives = {
  id: "jira",
  displayName: "Jira",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: `${ISSUE_KEY} · ${BOARD} - Jira`,
  Chrome,
  Cover,
  ...createKitPrimitives({ variant: "cell", idPrefix: "jira" }),
};
