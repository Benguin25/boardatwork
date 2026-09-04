"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NAV_MAKE_ONE, findNav } from "@/components/primitives/nav";
import type {
  ActionsProps,
  ChromeProps,
  FeedbackProps,
  GridProps,
  LogProps,
  LogicGridProps,
  ModalProps,
  NumberFieldProps,
  PassageProps,
  PassesProps,
  PromptProps,
  SkinPrimitives,
  SliderProps,
  SlotsProps,
  SummaryProps,
  TextRunProps,
} from "@/components/primitives/types";
import { useOverlay } from "@/components/shell/use-overlay";
import { svgFavicon } from "@/lib/favicon";
import { SkinMenu, chromeMenuItems } from "../shared/menu";
import { RailContext, useRail, useRailSlot } from "../shared/rail";

/**
 * Docs disguise, rebuilt against the Work half of
 * `reference-braid-prototype.html`: title bar with the doc icon and the
 * File/Edit/View menus, a grey toolbar pill, one 8.5" page on a pale
 * canvas, and a right-margin comment thread from "Reviewer" that carries
 * the game's feedback, counters and buttons.
 */

const DOC_TITLE = "Weekly sync — action items";
const MENUS = ["File", "Edit", "View", "Insert", "Format", "Tools", "Extensions", "Help"];

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='#4285F4' d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path fill='#A1C2FA' d='M14 2v6h6z'/></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" data-testid="docs-icon">
      <path fill="#4285F4" d="M24 4H10a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3V13z" />
      <path fill="#A1C2FA" d="M24 4v9h9z" />
      <path fill="#F1F1F1" d="M13 20h14v2H13zm0 4h14v2H13zm0 4h9v2h-9z" />
    </svg>
  );
}

function groupBackground(
  groupId: string | undefined,
  groupTokens: Readonly<Record<string, string>> | undefined,
  locked: boolean,
): string {
  const base = groupId ? groupTokens?.[groupId] : undefined;
  if (!base) {
    return "transparent";
  }
  return `var(${locked ? `${base}-lock` : base})`;
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="doc-section">
      <h3 className="mb-2 mt-[22px] text-[14pt] font-normal">{label}</h3>
      {children}
    </section>
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
  const share = findNav(nav, NAV_MAKE_ONE);

  return (
    <div data-testid="chrome-docs" className="skin-docs min-h-screen">
      <div className="flex items-start gap-3 px-4 pt-2">
        <Icon className="h-10 w-10 flex-none" />
        <div className="min-w-0 flex-1">
          <h1>
            <button
              type="button"
              onClick={onTitleClick}
              title="Click to blur into notes"
              className="inline-block max-w-full truncate rounded px-1.5 py-0.5 text-left text-[18px] font-normal hover:outline hover:outline-1 hover:outline-[var(--line)]"
            >
              {DOC_TITLE}
            </button>
          </h1>
          <div aria-hidden="true" className="mt-0.5 flex gap-0.5" data-testid="docs-menus">
            {MENUS.map((menu) => (
              <span key={menu} className="rounded px-[7px] py-0.5 text-[14px] hover:bg-[#e9eef6]">
                {menu}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-[14px]">
          <button
            type="button"
            onClick={share?.onClick}
            data-testid="docs-share"
            className="flex items-center gap-2 rounded-full bg-[var(--chip)] py-[9px] pl-[14px] pr-[18px] text-[14px] font-medium text-[#001d35]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#001D35" aria-hidden="true">
              <path d="M12 2a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 12c4.4 0 8 2 8 4.5V20H4v-1.5C4 16 7.6 14 12 14z" />
            </svg>
            {share?.label ?? "Share"}
          </button>
          <SkinMenu
            triggerLabel="Account and settings"
            triggerClassName="flex h-8 w-8 items-center justify-center rounded-full bg-[#7b4fbf] text-[14px] font-medium text-white"
            trigger={<span aria-hidden="true">Z</span>}
            items={chromeMenuItems(nav, onChangeDisguise, onExitMode)}
          />
        </div>
      </div>

      <div
        aria-hidden="true"
        data-testid="docs-toolbar"
        className="mx-4 mt-2.5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-[#edf2fa] px-[14px] py-1.5 text-[14px]"
      >
        <span className="flex-none rounded px-2 py-1">↶</span>
        <span className="flex-none rounded px-2 py-1">↷</span>
        <span className="flex-none rounded px-2 py-1">🖨</span>
        <span className="mx-1.5 h-5 w-px flex-none bg-[#c7ccd3]" />
        <span className="flex-none rounded px-2 py-1">100% ▾</span>
        <span className="mx-1.5 h-5 w-px flex-none bg-[#c7ccd3]" />
        <span className="flex-none rounded px-2 py-1">Normal text ▾</span>
        <span className="mx-1.5 h-5 w-px flex-none bg-[#c7ccd3]" />
        <span className="flex-none rounded px-2 py-1">Arial ▾</span>
        <span className="mx-1.5 h-5 w-px flex-none bg-[#c7ccd3]" />
        <span className="flex-none rounded px-2 py-1">− 11 +</span>
        <span className="mx-1.5 h-5 w-px flex-none bg-[#c7ccd3]" />
        <span className="flex-none rounded px-2 py-1">
          <b className="px-1">B</b>
          <i className="px-1">I</i>
          <u className="px-1">U</u>
        </span>
        <span className="ml-auto flex-none rounded px-2 py-1">✎ Editing ▾</span>
      </div>

      <div className="flex flex-wrap justify-center gap-4 px-4 pb-20 pt-5">
        <div className="doc-page min-h-[900px] w-[816px] max-w-full rounded-sm border border-[var(--line)] bg-[var(--paper)] px-24 py-[88px] text-[11pt] leading-[1.55] max-[640px]:min-h-0 max-[640px]:px-[22px] max-[640px]:py-10">
          <h2 className="mb-1 text-[20pt] font-normal">{DOC_TITLE}</h2>
          <div className="mb-[22px] text-[var(--muted)]">
            {[meta, subtitle].filter(Boolean).join(" · ")}
          </div>
          <RailContext.Provider value={slots}>{children}</RailContext.Provider>
          <Section label="Notes">
            <p className="mb-2">
              This document is generated from the shared template. Sections above are
              filled in during the review pass; nothing here needs editing by hand.
            </p>
            <p className="text-[10pt] text-[var(--muted)]">
              Click the document title to blur into notes. Esc returns to the game.
            </p>
          </Section>
        </div>

        <div className="flex w-[300px] max-w-full flex-none flex-col gap-3 pt-[88px] max-[1180px]:w-[816px] max-[1180px]:pt-0">
          {notice !== undefined && (
            <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3 text-[13px] shadow-sm">
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#188038] text-[12px] font-medium text-white"
                >
                  A
                </span>
                <span className="font-medium">A friend</span>
                <span className="ml-auto text-[12px] text-[var(--muted)]">shared</span>
              </div>
              <p className="leading-[1.45]">{notice}</p>
            </div>
          )}
          <div
            data-testid="docs-comment"
            className="rounded-lg border border-[#fbbc04] bg-[var(--paper)] p-3 text-[13px] shadow-md"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#e37400] text-[12px] font-medium text-white"
              >
                R
              </span>
              <span className="font-medium">Reviewer</span>
              <span className="ml-auto text-[12px] text-[var(--muted)]">now</span>
            </div>
            <div className="leading-[1.45]">
              <div ref={setFeedbackEl} />
              <div ref={setPassesEl} />
            </div>
            <div ref={setActionsEl} className="mt-2.5 flex flex-wrap gap-0.5" />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 flex justify-between border-t border-[var(--line)] bg-[var(--paper)] px-4 py-1.5 text-[12px] text-[var(--muted)]">
        <span>Page 1 of 1</span>
        <span>Last edit was seconds ago</span>
      </div>
    </div>
  );
}

function Prompt({ headline, tone, note }: PromptProps): React.ReactElement {
  return (
    <Section label="Reference string">
      <p className="mb-2">
        {tone === "pending" ? (
          <em className="text-[var(--muted)]">{headline}</em>
        ) : (
          <span>{headline}</span>
        )}
        {note !== undefined && <em className="ml-2 text-[var(--muted)]">{note}</em>}
      </p>
    </Section>
  );
}

function TextRun({ items, ariaLabel, groupTokens, onSelect }: TextRunProps): React.ReactElement {
  return (
    <>
      <div
        role="group"
        aria-label={ariaLabel}
        className="my-1 select-none text-[16pt] leading-[2] tracking-[2px] max-[640px]:text-[14pt]"
      >
        {items.map((item) => {
          const locked = item.state === "locked";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              aria-label={item.ariaLabel ?? item.text}
              disabled={locked || !onSelect}
              style={{
                background: groupBackground(item.groupId, groupTokens, locked),
                fontWeight: locked ? 700 : 400,
                textDecoration: item.state === "wrong" ? "underline wavy var(--danger)" : "none",
                textDecorationThickness: item.state === "wrong" ? "1.5px" : undefined,
              }}
              className="inline-block min-w-6 rounded-sm px-[3px] text-center leading-[1.5] tracking-normal disabled:cursor-default max-[640px]:min-w-5"
            >
              {item.text}
            </button>
          );
        })}
      </div>
      <p className="text-[10pt] text-[var(--muted)]">
        Highlight each character to assign it to a stream. Order is preserved within a
        stream.
      </p>
    </>
  );
}

function Slots({ rows, groupTokens }: SlotsProps): React.ReactElement {
  return (
    <Section label="Streams">
      <ul className="mb-1.5 list-disc pl-[22px]">
        {rows.map((row) => (
          <li key={row.id} className="mb-1.5" aria-label={row.ariaLabel}>
            {row.slots.map((slot) => (
              <span
                key={slot.id}
                style={{ background: groupBackground(row.groupId, groupTokens, false) }}
                className="mr-[3px] inline-block h-5 w-[18px] border-b border-[#444] text-center leading-[1.3]"
              >
                {slot.value ?? ""}
              </span>
            ))}
            {row.note !== undefined && (
              <span className="ml-2 text-[9pt] text-[var(--muted)]">{row.note}</span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Passes({ label, used, total }: PassesProps): React.ReactElement | null {
  const slot = useRailSlot("passes");
  const body = (
    <span className="text-[var(--muted)]">
      {label}
      <span className="ml-1.5 inline-flex gap-1 align-middle" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2 w-2 border-[1.5px] border-[var(--muted)]"
            style={{ background: i < used ? "var(--muted)" : "transparent" }}
          />
        ))}
      </span>
      <span className="sr-only">
        : {used} of {total} used
      </span>
    </span>
  );
  if (!slot) {
    return null;
  }
  return createPortal(body, slot);
}

function Actions({ actions }: ActionsProps): React.ReactElement {
  const slot = useRailSlot("actions");
  const body = (
    <>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.variant === "primary"
              ? "rounded-full bg-[var(--blue)] px-2.5 py-1.5 text-[13px] font-medium text-white disabled:bg-[#c7ccd3]"
              : "rounded-full px-2.5 py-1.5 text-[13px] font-medium text-[var(--blue)] hover:bg-[#e8f0fe] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[#9aa0a6]"
          }
        >
          {action.label}
        </button>
      ))}
    </>
  );
  if (!slot) {
    return <div className="mt-3 flex flex-wrap gap-0.5">{body}</div>;
  }
  return createPortal(body, slot);
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement | null {
  const slot = useRailSlot("feedback");
  const body = (
    <p role="status" aria-live="polite" style={{ color: tone === "error" ? "var(--danger)" : undefined }}>
      {message === "" ? "Assign every character, then request a pass." : message}
    </p>
  );
  if (!slot) {
    return body;
  }
  return createPortal(body, slot);
}

function Log({ entries, ariaLabel }: LogProps): React.ReactElement {
  return (
    <Section label="Log">
      <ul className="mb-1.5 list-disc pl-[22px]" aria-label={ariaLabel}>
        {entries.map((entry) => (
          <li key={entry.id} className="mb-1.5">
            {entry.author !== undefined && <strong className="mr-1">{entry.author}</strong>}
            {entry.text}
            {entry.status !== undefined && (
              <span
                style={{
                  color: entry.status === "yes" ? "#188038" : "var(--danger)",
                }}
                className="ml-2 font-bold"
              >
                <span aria-hidden="true">{entry.status === "yes" ? "✓" : "✗"}</span>
                <span className="sr-only">
                  {entry.status === "yes" ? "fits the rule" : "does not fit the rule"}
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Summary({ items, ariaLabel }: SummaryProps): React.ReactElement {
  return (
    <Section label="Resolved">
      <dl className="mb-1.5 grid grid-cols-[auto_1fr] gap-x-4" aria-label={ariaLabel}>
        {items.map((item) => (
          <div key={item.id} className="contents">
            <dt className="text-[var(--muted)]">{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function Grid({
  rows,
  cols,
  cells,
  ariaLabel,
  rowTotals,
  colTotals,
  onSelect,
}: GridProps): React.ReactElement {
  return (
    <Section label="Figures">
      <div className="overflow-x-auto">
        <table className="border-collapse text-center text-[10pt]">
          <caption className="sr-only">{ariaLabel}</caption>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }, (_, c) => {
                  const cell = cells[r * cols + c];
                  if (!cell) {
                    return <td key={c} className="border border-[var(--line)]" />;
                  }
                  const flagged = cell.state === "selected" || cell.state === "locked";
                  return (
                    <td key={cell.id} className="border border-[var(--line)] p-0">
                      <button
                        type="button"
                        onClick={() => onSelect?.(cell.id)}
                        disabled={cell.state === "locked" || !onSelect}
                        aria-pressed={flagged}
                        aria-label={`Row ${String(r + 1)}, column ${String(c + 1)}: ${cell.value}${
                          flagged ? ", flagged" : ""
                        }`}
                        style={{
                          background: flagged ? "var(--accent-a)" : "transparent",
                          fontWeight: cell.state === "locked" ? 700 : 400,
                        }}
                        className="flex h-8 w-[68px] items-center justify-center px-2 text-right tabular-nums disabled:cursor-default"
                      >
                        {cell.value}
                      </button>
                    </td>
                  );
                })}
                {rowTotals?.[r] !== undefined && (
                  <td
                    className="px-2 tabular-nums"
                    style={{
                      color: rowTotals[r].reconciled ? "var(--muted)" : "var(--danger)",
                    }}
                  >
                    {rowTotals[r].value}
                    {!rowTotals[r].reconciled && (
                      <span className="sr-only"> does not reconcile</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {colTotals && (
              <tr>
                {colTotals.map((total, c) => (
                  <td
                    key={c}
                    className="pt-1 tabular-nums"
                    style={{ color: total.reconciled ? "var(--muted)" : "var(--danger)" }}
                  >
                    {total.value}
                    {!total.reconciled && <span className="sr-only"> does not reconcile</span>}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Passage({ words, onSelect }: PassageProps): React.ReactElement {
  return (
    <Section label="Draft">
      <p className="mb-2 leading-[1.8]">
        {words.map((word, i) => {
          const flagged = word.state === "selected" || word.state === "locked";
          return (
            <span key={word.id}>
              <button
                type="button"
                onClick={() => onSelect?.(word.id)}
                disabled={word.state === "locked" || !onSelect}
                aria-pressed={flagged}
                aria-label={`${word.text}${flagged ? ", flagged" : ""}`}
                style={{
                  background: flagged ? "var(--accent-a)" : "transparent",
                  fontWeight: word.state === "locked" ? 700 : 400,
                }}
                className="rounded-sm px-[1px] disabled:cursor-default"
              >
                {word.text}
              </button>
              {i < words.length - 1 ? " " : null}
            </span>
          );
        })}
      </p>
    </Section>
  );
}

function Modal({ open, title, onClose, children }: ModalProps): React.ReactElement | null {
  const cardRef = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose);

  useEffect(() => {
    if (open) {
      cardRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }
  return (
    <RailContext.Provider value={null}>
      <div
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      >
        <div
          ref={cardRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="docs-modal-title"
          className="skin-docs max-h-[85vh] w-[440px] max-w-full overflow-auto rounded-lg border border-[var(--line)] bg-[var(--paper)] p-6 text-[14px] shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 id="docs-modal-title" className="text-[18px] font-normal">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded px-2 text-[20px] leading-none hover:bg-black/5"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </RailContext.Provider>
  );
}

function Slider({ label, min, max, step, value, unit, onChange }: SliderProps): React.ReactElement {
  return (
    <div className="mb-3">
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
        className="w-full accent-[var(--blue)]"
      />
      <div className="flex justify-between text-[10pt] text-[var(--muted)]">
        <span>
          {min}
          {unit ?? ""}
        </span>
        <span>
          {max}
          {unit ?? ""}
        </span>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: NumberFieldProps): React.ReactElement {
  return (
    <label className="mb-2 flex items-baseline gap-2">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
        className="w-[200px] border-b border-[#444] px-1 py-0.5 text-[16pt] tabular-nums"
      />
      {unit !== undefined && unit !== "" && (
        <span className="text-[10pt] text-[var(--muted)]">{unit}</span>
      )}
    </label>
  );
}

function LogicGrid({
  rowLabels,
  colLabels,
  cells,
  ariaLabel,
  onSelect,
}: LogicGridProps): React.ReactElement {
  const cellFor = (rowId: string, colId: string) =>
    cells.find((cell) => cell.rowId === rowId && cell.colId === colId);
  return (
    <Section label="Assignments">
      <div className="overflow-x-auto">
        <table className="border-collapse text-center text-[9pt]">
          <caption className="sr-only">{ariaLabel}</caption>
          <thead>
            <tr>
              <th className="sr-only">Person</th>
              {colLabels.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className="border border-[var(--line)] px-1 py-1 font-normal text-[var(--muted)]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((row) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="whitespace-nowrap border border-[var(--line)] px-2 text-right font-normal"
                >
                  {row.label}
                </th>
                {colLabels.map((col) => {
                  const state = cellFor(row.id, col.id)?.state ?? "empty";
                  return (
                    <td key={col.id} className="border border-[var(--line)] p-0">
                      <button
                        type="button"
                        onClick={() => onSelect?.(row.id, col.id)}
                        disabled={!onSelect}
                        aria-label={`${row.label}, ${col.label}: ${state}`}
                        style={{
                          background: state === "yes" ? "var(--accent-b)" : "transparent",
                        }}
                        className="flex h-7 w-9 items-center justify-center font-bold disabled:cursor-default"
                      >
                        {state === "yes" ? "✓" : state === "no" ? "✗" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-docs" className="skin-docs min-h-screen">
      <div className="flex items-start gap-3 px-4 pt-2">
        <Icon className="h-10 w-10 flex-none" />
        <div className="min-w-0 flex-1">
          <h1>
            <button
              type="button"
              onClick={onExit}
              className="inline-block max-w-full truncate rounded px-1.5 py-0.5 text-left text-[18px] font-normal hover:outline hover:outline-1 hover:outline-[var(--line)]"
            >
              {DOC_TITLE}
            </button>
          </h1>
          <div aria-hidden="true" className="mt-0.5 flex gap-0.5">
            {MENUS.map((menu) => (
              <span key={menu} className="rounded px-[7px] py-0.5 text-[14px]">
                {menu}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-center px-4 pb-20 pt-5">
        <div className="min-h-[900px] w-[816px] max-w-full rounded-sm border border-[var(--line)] bg-[var(--paper)] px-24 py-[88px] text-[11pt] leading-[1.55] max-[640px]:min-h-0 max-[640px]:px-[22px] max-[640px]:py-10">
          <h2 className="mb-1 text-[20pt] font-normal">{DOC_TITLE}</h2>
          <div className="mb-[22px] text-[var(--muted)]">Recurring · Owner: platform team</div>
          <h3 className="mb-2 mt-[22px] text-[14pt] font-normal">1. Status</h3>
          <ul className="mb-1.5 list-disc pl-[22px]">
            <li className="mb-1.5">
              Q3 roadmap review moved to Thursday; deck still needs the updated retention
              slide.
            </li>
            <li className="mb-1.5">
              Vendor renewal is out for legal review, expected back end of week.
            </li>
            <li className="mb-1.5">
              Onboarding doc rewrite is 70% done; remaining sections are billing and
              permissions.
            </li>
          </ul>
          <h3 className="mb-2 mt-[22px] text-[14pt] font-normal">2. Decisions</h3>
          <ul className="mb-1.5 list-disc pl-[22px]">
            <li className="mb-1.5">Keep the current sprint length; revisit in October.</li>
            <li className="mb-1.5">Consolidate the two status channels into one.</li>
          </ul>
          <h3 className="mb-2 mt-[22px] text-[14pt] font-normal">3. Follow-ups</h3>
          <ul className="mb-1.5 list-disc pl-[22px]">
            <li className="mb-1.5">Circulate revised timeline before Friday.</li>
            <li className="mb-1.5">Confirm headcount ask with finance.</li>
            <li className="mb-1.5">Draft FAQ for the support team.</li>
          </ul>
          <p className="mt-[30px] text-[10pt] text-[var(--muted)]">
            Click the title to return.
          </p>
        </div>
      </div>
    </div>
  );
}

export const docsSkin: SkinPrimitives = {
  id: "docs",
  displayName: "Docs",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: `${DOC_TITLE} - Google Docs`,
  Chrome,
  Prompt,
  TextRun,
  Slots,
  Grid,
  Passage,
  Passes,
  Actions,
  Feedback,
  Log,
  Summary,
  Modal,
  Slider,
  NumberField,
  LogicGrid,
  Cover,
};
