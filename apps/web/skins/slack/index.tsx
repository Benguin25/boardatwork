"use client";

import type {
  ChromeNavItem,
  ChromeProps,
  SkinPrimitives,
} from "@/components/primitives/types";
import { svgFavicon } from "@/lib/favicon";
import { createKitPrimitives } from "../kit";
import { SkinMenu, chromeMenuItems } from "../shared/menu";
import { RailContext, useRail } from "../shared/rail";

/** Slack disguise — see `docs/design/disguises.md` for the chrome checklist. */

const WORKSPACE = "Northwind";
const CHANNEL = "proj-platform";
const CHANNELS = ["general", "proj-platform", "design-review", "incidents", "random"];
const DMS = [
  { name: "Priya R.", online: true },
  { name: "Sam O.", online: false },
  { name: "Marta K.", online: true },
];

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='5' fill='#3F0E40'/><path fill='#fff' d='M8 6.5a1.5 1.5 0 1 1 3 0V10H9.5A1.5 1.5 0 0 1 8 8.5zm5.5 3.5a1.5 1.5 0 1 1 0-3H17v1.5A1.5 1.5 0 0 1 15.5 10zM16 13.5a1.5 1.5 0 1 1-3 0V10h1.5a1.5 1.5 0 0 1 1.5 1.5zM10.5 14a1.5 1.5 0 1 1 0 3H7v-1.5A1.5 1.5 0 0 1 8.5 14z'/></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" data-testid="slack-icon">
      <rect width="24" height="24" rx="5" fill="#3F0E40" />
      <path
        fill="#fff"
        d="M8 6.5a1.5 1.5 0 1 1 3 0V10H9.5A1.5 1.5 0 0 1 8 8.5zm5.5 3.5a1.5 1.5 0 1 1 0-3H17v1.5A1.5 1.5 0 0 1 15.5 10zM16 13.5a1.5 1.5 0 1 1-3 0V10h1.5a1.5 1.5 0 0 1 1.5 1.5zM10.5 14a1.5 1.5 0 1 1 0 3H7v-1.5A1.5 1.5 0 0 1 8.5 14z"
      />
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
      data-testid="slack-sidebar"
      className="hidden w-[240px] flex-none flex-col bg-[var(--sidebar)] px-2 pb-4 pt-3 text-[15px] text-[var(--sidebar-ink)] md:flex"
    >
      <div className="mb-3 flex items-center gap-2 px-2">
        <span className="flex-1 truncate text-[17px] font-black text-white">{WORKSPACE}</span>
        <SkinMenu
          triggerLabel="Workspace settings"
          triggerClassName="flex h-7 w-7 items-center justify-center rounded bg-[#7b4fbf] text-[12px] font-semibold text-white"
          trigger={<span aria-hidden="true">Z</span>}
          align="left"
          items={chromeMenuItems(nav, onChangeDisguise, onExitMode)}
        />
      </div>
      <button
        type="button"
        onClick={onChangeDisguise}
        className="mb-4 self-start rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-[var(--sidebar)]"
      >
        New
      </button>
      <p className="px-2 pb-1 text-[13px] font-semibold">Channels</p>
      <ul className="mb-4">
        {CHANNELS.map((channel) => (
          <li
            key={channel}
            className={`truncate rounded px-2 py-1 ${
              channel === CHANNEL ? "bg-[#1164a3] font-bold text-white" : ""
            }`}
          >
            <span aria-hidden="true" className="mr-1.5 opacity-70">
              #
            </span>
            {channel}
          </li>
        ))}
      </ul>
      <p className="px-2 pb-1 text-[13px] font-semibold">Direct messages</p>
      <ul>
        {DMS.map((dm) => (
          <li key={dm.name} className="flex items-center gap-2 rounded px-2 py-1">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full border border-current"
              style={{ background: dm.online ? "#2bac76" : "transparent" }}
            />
            {dm.name}
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
  const { slots, setFeedbackEl, setPassesEl, setActionsEl } = useRail();

  return (
    <div data-testid="chrome-slack" className="skin-slack flex min-h-screen">
      <Sidebar nav={nav} onChangeDisguise={onChangeDisguise} onExitMode={onExitMode} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--line)] px-5 py-3">
          <h1>
            <button
              type="button"
              onClick={onTitleClick}
              className="rounded px-1 text-[18px] font-black hover:bg-black/5"
            >
              <span aria-hidden="true" className="mr-1 text-[var(--muted)]">
                #
              </span>
              {CHANNEL}
            </button>
          </h1>
          <p className="text-[13px] text-[var(--muted)]" data-testid="slack-topic">
            18 members · Weekly review thread — {[meta, subtitle].filter(Boolean).join(" · ")}
          </p>
        </header>
        <div className="flex min-h-0 flex-1 flex-wrap">
          <main className="min-w-0 flex-1 px-5 py-4">
            {notice !== undefined && (
              <p className="mb-4 border-l-4 border-[var(--brand)] bg-[var(--accent-b)] px-3 py-2 text-sm">
                {notice}
              </p>
            )}
            <div className="flex gap-3">
              <span
                aria-hidden="true"
                className="h-9 w-9 flex-none rounded bg-[#e8912d] text-center text-[15px] font-bold leading-9 text-white"
              >
                P
              </span>
              <div className="min-w-0 flex-1">
                <p className="mb-1">
                  <strong className="text-[15px] font-black">Priya R.</strong>
                  <span className="ml-2 text-[12px] text-[var(--muted)]">9:41 AM</span>
                </p>
                <RailContext.Provider value={slots}>{children}</RailContext.Provider>
                <p className="mt-2 text-[13px] font-bold text-[#1264a3]">1 reply</p>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="mt-6 flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2 text-[15px] text-[var(--muted)]"
            >
              <span>Message #{CHANNEL}</span>
              <span className="text-[var(--brand)]">➤</span>
            </div>
          </main>
          <aside
            data-testid="slack-thread"
            className="w-[320px] max-w-full flex-none border-l border-[var(--line)] px-4 py-4"
          >
            <h2 className="mb-1 text-[15px] font-black">Thread</h2>
            <p className="mb-3 text-[12px] text-[var(--muted)]">#{CHANNEL}</p>
            <div className="flex gap-2">
              <span
                aria-hidden="true"
                className="h-8 w-8 flex-none rounded bg-[#4a154b] text-center text-[13px] font-bold leading-8 text-white"
              >
                R
              </span>
              <div className="min-w-0 flex-1">
                <p className="mb-1">
                  <strong className="text-[14px] font-black">Reviewer</strong>
                  <span className="ml-2 text-[12px] text-[var(--muted)]">now</span>
                </p>
                <div ref={setFeedbackEl} />
                <div ref={setPassesEl} className="mt-1" />
                <div ref={setActionsEl} className="mt-2 flex flex-wrap gap-2" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-slack" className="skin-slack flex min-h-screen">
      <aside className="hidden w-[240px] flex-none flex-col bg-[var(--sidebar)] px-2 pb-4 pt-3 text-[15px] text-[var(--sidebar-ink)] md:flex">
        <span className="mb-4 px-2 text-[17px] font-black text-white">{WORKSPACE}</span>
        <ul>
          {CHANNELS.map((channel) => (
            <li key={channel} className="truncate rounded px-2 py-1">
              <span aria-hidden="true" className="mr-1.5 opacity-70">
                #
              </span>
              {channel}
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--line)] px-5 py-3">
          <h1>
            <button
              type="button"
              onClick={onExit}
              className="rounded px-1 text-[18px] font-black hover:bg-black/5"
            >
              <span aria-hidden="true" className="mr-1 text-[var(--muted)]">
                #
              </span>
              {CHANNEL}
            </button>
          </h1>
          <p className="text-[13px] text-[var(--muted)]">18 members</p>
        </header>
        <main className="flex-1 px-5 py-4 text-[15px]">
          {[
            { who: "Priya R.", at: "9:41 AM", text: "Standup notes are in the doc, nothing blocking." },
            { who: "Sam O.", at: "9:52 AM", text: "Vendor renewal is with legal, back by Friday." },
            { who: "Marta K.", at: "10:04 AM", text: "Moved the roadmap review to Thursday." },
          ].map((message) => (
            <div key={message.who} className="mb-4 flex gap-3">
              <span
                aria-hidden="true"
                className="h-9 w-9 flex-none rounded bg-[#4a154b] text-center text-[15px] font-bold leading-9 text-white"
              >
                {message.who.charAt(0)}
              </span>
              <p>
                <strong className="font-black">{message.who}</strong>
                <span className="ml-2 text-[12px] text-[var(--muted)]">{message.at}</span>
                <br />
                {message.text}
              </p>
            </div>
          ))}
          <p className="text-[13px] text-[var(--muted)]">Click the channel name to return.</p>
        </main>
      </div>
    </div>
  );
}

export const slackSkin: SkinPrimitives = {
  id: "slack",
  displayName: "Slack",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: `#${CHANNEL} (Northwind) - Slack`,
  Chrome,
  Cover,
  ...createKitPrimitives({ variant: "highlight", idPrefix: "slack" }),
};
