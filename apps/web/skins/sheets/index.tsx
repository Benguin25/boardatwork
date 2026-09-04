"use client";

import type {
  ChromeNavItem,
  ChromeProps,
  SkinPrimitives,
} from "@/components/primitives/types";
import { svgFavicon } from "@/lib/favicon";
import { createKitPrimitives } from "../kit";
import { SkinMenu, chromeMenuItems } from "../shared/menu";

/** Sheets disguise — see `docs/design/disguises.md` for the chrome checklist. */

const SHEET_TITLE = "Q3 headcount model";
const MENUS = ["File", "Edit", "View", "Insert", "Format", "Data", "Tools"];
const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROWS = Array.from({ length: 30 }, (_, i) => i + 1);
const TABS = ["Q3 model", "Assumptions", "Sheet3"];

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='#0F9D58' d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path fill='#87CEAC' d='M14 2v6h6z'/><path fill='#fff' d='M8 12h8v1.6H8zm0 3h8v1.6H8zm0 3h8v1.6H8z'/></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" data-testid="sheets-icon">
      <path fill="#0F9D58" d="M24 4H10a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3V13z" />
      <path fill="#87CEAC" d="M24 4v9h9z" />
      <path fill="#F1F1F1" d="M13 19h14v2H13zm0 4h14v2H13zm0 4h14v2H13z" />
    </svg>
  );
}

/** Faint 21px gridlines behind the work area — the cheapest honest spreadsheet. */
const GRID_BACKGROUND: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px 21px), repeating-linear-gradient(to right, var(--line) 0 1px, transparent 1px 96px)",
};

function TopBar({
  onTitleClick,
  nav,
  onChangeDisguise,
  onExitMode,
}: {
  onTitleClick: (() => void) | undefined;
  nav: readonly ChromeNavItem[];
  onChangeDisguise: () => void;
  onExitMode: (() => void) | undefined;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-2">
      <Icon className="h-9 w-9 flex-none" />
      <div className="min-w-0 flex-1">
        <h1>
          <button
            type="button"
            onClick={onTitleClick}
            className="max-w-full truncate rounded px-1 text-[17px] font-normal hover:bg-black/5"
          >
            {SHEET_TITLE}
          </button>
        </h1>
        <div aria-hidden="true" className="flex gap-0.5" data-testid="sheets-menus">
          {MENUS.map((menu) => (
            <span key={menu} className="rounded px-1.5 py-0.5 text-[13px] text-[var(--muted)]">
              {menu}
            </span>
          ))}
        </div>
      </div>
      <SkinMenu
        triggerLabel="Spreadsheet settings"
        triggerClassName="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-[13px] font-medium text-white"
        trigger={<span aria-hidden="true">Z</span>}
        items={chromeMenuItems(nav, onChangeDisguise, onExitMode)}
      />
    </div>
  );
}

function FormulaBar(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      data-testid="sheets-formula-bar"
      className="flex items-center gap-2 border-b border-[var(--line)] bg-[#f8f9fa] px-3 py-1 text-[13px]"
    >
      <span className="w-16 rounded border border-[var(--line)] bg-white px-2 py-0.5">B4 ▾</span>
      <span className="italic text-[var(--muted)]">fx</span>
      <span className="truncate text-[var(--muted)]">
        =SUMPRODUCT(headcount!$B$2:$B$40, rates!$C$2:$C$40)
      </span>
    </div>
  );
}

function ColumnHeaders(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      data-testid="sheets-columns"
      className="flex overflow-hidden border-b border-[var(--line)] bg-[#f8f9fa] text-center text-[11px] text-[var(--muted)]"
    >
      <span className="w-10 flex-none border-r border-[var(--line)]" />
      {COLUMNS.map((col) => (
        <span key={col} className="w-24 flex-none border-r border-[var(--line)] py-0.5">
          {col}
        </span>
      ))}
    </div>
  );
}

function RowGutter(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      data-testid="sheets-rows"
      className="w-10 flex-none border-r border-[var(--line)] bg-[#f8f9fa] text-center text-[11px] text-[var(--muted)]"
    >
      {ROWS.map((row) => (
        <div key={row} className="h-[21px] leading-[21px]">
          {row}
        </div>
      ))}
    </div>
  );
}

function SheetTabs(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      data-testid="sheets-tabs"
      className="flex items-center gap-1 border-t border-[var(--line)] bg-[#f8f9fa] px-3 py-1.5 text-[12px]"
    >
      <span className="px-1 text-[var(--muted)]">+</span>
      {TABS.map((tab, i) => (
        <span
          key={tab}
          className={
            i === 0
              ? "rounded-t border-b-2 border-[var(--brand)] bg-white px-3 py-1 font-medium"
              : "px-3 py-1 text-[var(--muted)]"
          }
        >
          {tab}
        </span>
      ))}
      <span className="ml-auto text-[var(--muted)]">Sum: 41,208</span>
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
  return (
    <div data-testid="chrome-sheets" className="skin-sheets flex min-h-screen flex-col">
      <header>
      <TopBar
        onTitleClick={onTitleClick}
        nav={nav}
        onChangeDisguise={onChangeDisguise}
        onExitMode={onExitMode}
      />
      <div
        aria-hidden="true"
        data-testid="sheets-toolbar"
        className="flex items-center gap-3 border-b border-[var(--line)] px-3 py-1 text-[13px] text-[var(--muted)]"
      >
        <span>↶</span>
        <span>↷</span>
        <span>$</span>
        <span>%</span>
        <span>.0</span>
        <span>.00</span>
        <span>123 ▾</span>
      </div>
      <FormulaBar />
      <ColumnHeaders />
      </header>
      <main className="flex flex-1">
        <RowGutter />
        <div style={GRID_BACKGROUND} className="min-w-0 flex-1 px-6 py-5">
          <div className="max-w-[760px] bg-[var(--paper)]/90 p-4 outline outline-2 outline-[#1a73e8]">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--muted)]">
              {[meta, subtitle].filter(Boolean).join(" · ")}
            </p>
            {notice !== undefined && (
              <p className="mb-3 border-l-4 border-[var(--brand)] bg-[var(--accent-b)] px-3 py-2 text-sm">
                {notice}
              </p>
            )}
            {children}
          </div>
        </div>
      </main>
      <footer>
        <SheetTabs />
      </footer>
    </div>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-sheets" className="skin-sheets flex min-h-screen flex-col">
      <header>
      <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-2">
        <Icon className="h-9 w-9 flex-none" />
        <div className="min-w-0 flex-1">
          <h1>
            <button
              type="button"
              onClick={onExit}
              className="max-w-full truncate rounded px-1 text-[17px] font-normal hover:bg-black/5"
            >
              {SHEET_TITLE}
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
      <FormulaBar />
      <ColumnHeaders />
      </header>
      <main className="flex flex-1">
        <RowGutter />
        <div style={GRID_BACKGROUND} className="min-w-0 flex-1 px-6 py-5 text-[13px]">
          <table className="border-collapse bg-white text-left">
            <tbody>
              {[
                ["Region", "Q1", "Q2", "Q3"],
                ["North", "412", "455", "470"],
                ["South", "388", "401", "396"],
                ["EMEA", "512", "534", "551"],
                ["APAC", "297", "310", "329"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell} className="border border-[var(--line)] px-3 py-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[var(--muted)]">Click the file name to return.</p>
        </div>
      </main>
      <footer>
        <SheetTabs />
      </footer>
    </div>
  );
}

export const sheetsSkin: SkinPrimitives = {
  id: "sheets",
  displayName: "Sheets",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: `${SHEET_TITLE} - Google Sheets`,
  Chrome,
  Cover,
  ...createKitPrimitives({ variant: "cell", idPrefix: "sheets" }),
};
