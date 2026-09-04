"use client";

import type { ChromeProps, SkinPrimitives } from "@/components/primitives/types";
import { svgFavicon } from "@/lib/favicon";
import { createKitPrimitives } from "../kit";
import { SkinMenu, chromeMenuItems } from "../shared/menu";

/** Outlook disguise — see `docs/design/disguises.md` for the chrome checklist. */

const SUBJECT = "RE: Weekly reconciliation";
const RIBBON = ["New mail", "Delete", "Archive", "Move", "Reply", "Reply all"];
const FOLDERS = [
  { name: "Inbox", count: 12 },
  { name: "Drafts", count: 2 },
  { name: "Sent", count: 0 },
  { name: "Archive", count: 0 },
  { name: "Deleted", count: 0 },
];
const MESSAGES = [
  { from: "Priya Raman", subject: SUBJECT, preview: "Numbers below for the pass —", at: "9:41 AM" },
  { from: "Finance ops", subject: "Headcount ask", preview: "Confirming the Q4 figure…", at: "8:12 AM" },
  { from: "Marta Kelsey", subject: "Roadmap review", preview: "Moving this to Thursday.", at: "Yesterday" },
];

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='4' fill='#0F6CBD'/><path fill='#fff' d='M4 7h9v10H4z' opacity='.35'/><ellipse cx='8.5' cy='12' rx='3.2' ry='4' fill='#fff'/><ellipse cx='8.5' cy='12' rx='1.4' ry='2' fill='#0F6CBD'/><path fill='#fff' d='M14 8h6v8h-6z'/></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" data-testid="outlook-icon">
      <rect width="24" height="24" rx="4" fill="#0F6CBD" />
      <ellipse cx="8.5" cy="12" rx="3.2" ry="4" fill="#fff" />
      <ellipse cx="8.5" cy="12" rx="1.4" ry="2" fill="#0F6CBD" />
      <path fill="#fff" d="M14 8h6v8h-6z" />
    </svg>
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
    <div data-testid="chrome-outlook" className="skin-outlook flex min-h-screen flex-col">
      <header>
      <div className="flex items-center gap-3 bg-[var(--brand)] px-4 py-2 text-white">
        <Icon className="h-6 w-6 flex-none" />
        <span className="text-[15px] font-semibold">Mail</span>
        <span aria-hidden="true" className="ml-auto text-[13px] opacity-90">
          Search
        </span>
        <SkinMenu
          triggerLabel="Mailbox settings"
          triggerClassName="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[var(--brand)]"
          trigger={<span aria-hidden="true">Z</span>}
          items={chromeMenuItems(nav, onChangeDisguise, onExitMode)}
        />
      </div>
      <div
        aria-hidden="true"
        data-testid="outlook-ribbon"
        className="flex gap-4 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-[13px] text-[var(--muted)]"
      >
        {RIBBON.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Folders"
          data-testid="outlook-folders"
          className="hidden w-[170px] flex-none border-r border-[var(--line)] bg-[var(--canvas)] px-3 py-3 text-[13px] md:block"
        >
          <ul className="flex flex-col gap-1">
            {FOLDERS.map((folder) => (
              <li
                key={folder.name}
                className={`flex rounded px-2 py-1 ${
                  folder.name === "Inbox" ? "bg-[var(--accent-c)] font-semibold" : ""
                }`}
              >
                <span className="flex-1">{folder.name}</span>
                {folder.count > 0 && <span className="text-[var(--muted)]">{folder.count}</span>}
              </li>
            ))}
          </ul>
        </nav>
        <aside aria-label="Message list" className="hidden lg:block">
        <ul
          data-testid="outlook-list"
          className="w-[250px] flex-none border-r border-[var(--line)] bg-[var(--paper)]"
        >
          {MESSAGES.map((message, i) => (
            <li
              key={message.subject}
              className={`border-b border-[var(--line)] px-3 py-2 text-[13px] ${
                i === 0 ? "border-l-[3px] border-l-[var(--brand)] bg-[var(--accent-c)]" : ""
              }`}
            >
              <p className="flex">
                <span className="flex-1 truncate font-semibold">{message.from}</span>
                <span className="text-[11px] text-[var(--muted)]">{message.at}</span>
              </p>
              <p className="truncate">{message.subject}</p>
              <p className="truncate text-[var(--muted)]">{message.preview}</p>
            </li>
          ))}
        </ul>
        </aside>
        <main data-testid="outlook-reading" className="min-w-0 flex-1 bg-[var(--paper)] px-6 py-5">
          <h1 className="mb-3">
            <button
              type="button"
              onClick={onTitleClick}
              className="rounded px-1 text-[20px] font-semibold hover:bg-black/5"
            >
              {SUBJECT}
            </button>
          </h1>
          <div className="mb-4 flex items-center gap-3 border-b border-[var(--line)] pb-3">
            <span
              aria-hidden="true"
              className="h-9 w-9 flex-none rounded-full bg-[#8764b8] text-center text-[14px] font-semibold leading-9 text-white"
            >
              P
            </span>
            <div className="min-w-0 flex-1 text-[13px]">
              <p className="font-semibold">
                Priya Raman{" "}
                <span className="font-normal text-[var(--muted)]">
                  &lt;priya.raman@northwind.example&gt;
                </span>
              </p>
              <p className="text-[var(--muted)]">
                To: me · {[meta, subtitle].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span aria-hidden="true" className="text-[13px] text-[var(--brand)]">
              Reply · Reply all · Forward
            </span>
          </div>
          {notice !== undefined && (
            <p className="mb-4 border-l-4 border-[var(--brand)] bg-[var(--accent-c)] px-3 py-2 text-sm">
              {notice}
            </p>
          )}
          {children}
        </main>
      </div>
      <footer className="border-t border-[var(--line)] bg-[var(--canvas)] px-4 py-1 text-[12px] text-[var(--muted)]">
        Items: 47 · Connected to Microsoft Exchange
      </footer>
    </div>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-outlook" className="skin-outlook flex min-h-screen flex-col">
      <header className="flex items-center gap-3 bg-[var(--brand)] px-4 py-2 text-white">
        <Icon className="h-6 w-6 flex-none" />
        <span className="text-[15px] font-semibold">Mail</span>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Folders"
          className="hidden w-[170px] flex-none border-r border-[var(--line)] bg-[var(--canvas)] px-3 py-3 text-[13px] md:block"
        >
          <ul className="flex flex-col gap-1">
            {FOLDERS.map((folder) => (
              <li key={folder.name} className="rounded px-2 py-1">
                {folder.name}
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1 bg-[var(--paper)] px-6 py-5 text-[14px]">
          <h1 className="mb-4">
            <button
              type="button"
              onClick={onExit}
              className="rounded px-1 text-[20px] font-semibold hover:bg-black/5"
            >
              {SUBJECT}
            </button>
          </h1>
          <p className="mb-3">Hi all,</p>
          <p className="mb-3">
            Thanks for turning the figures around so quickly. I have circulated the revised
            timeline and will confirm the headcount ask with finance before Friday.
          </p>
          <p className="mb-3">
            The onboarding rewrite is with the docs team; billing and permissions are the last
            two sections outstanding.
          </p>
          <p className="mb-6">Priya</p>
          <p className="text-[13px] text-[var(--muted)]">Click the subject to return.</p>
        </main>
      </div>
    </div>
  );
}

export const outlookSkin: SkinPrimitives = {
  id: "outlook",
  displayName: "Outlook",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: `${SUBJECT} - Outlook`,
  Chrome,
  Cover,
  ...createKitPrimitives({ variant: "highlight", idPrefix: "outlook" }),
};
