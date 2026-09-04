"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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

/**
 * Play skin — the un-disguised look, rebuilt against
 * `reference-braid-prototype.html`. Every colour and size comes from
 * `tokens.css`; nothing here is hard-coded and nothing here knows which
 * game it is rendering.
 */

const PILL =
  "rounded-full border border-[var(--ink)] bg-[var(--paper)] px-[26px] py-[14px] text-[16px] font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--ink)]";
const PILL_SOLID =
  "rounded-full border border-[var(--ink)] bg-[var(--ink)] px-[26px] py-[14px] text-[16px] font-semibold text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--ink)]";

function tokenFor(
  groupId: string | undefined,
  groupTokens: Readonly<Record<string, string>> | undefined,
  locked: boolean,
): string | undefined {
  const base = groupId ? groupTokens?.[groupId] : undefined;
  if (!base) {
    return undefined;
  }
  // Every skin defines a darker `-lock` companion for each group token, so a
  // locked unit reads as locked by weight *and* value, not hue alone.
  return locked ? `${base}-lock` : base;
}

function Chrome({
  title,
  subtitle,
  meta,
  notice,
  nav,
  onTitleClick,
  onChangeDisguise,
  children,
}: ChromeProps): React.ReactElement {
  return (
    <div data-testid="chrome-play" className="skin-play min-h-screen">
      <header className="mx-auto flex max-w-[1100px] items-center justify-between border-b border-[var(--ink)] px-5 py-[14px]">
        <h1 className="text-[26px] font-black tracking-[-0.02em]">
          {/* Play mode never covers, so the wordmark is plain text there;
              the `/dev/skins` harness passes a handler to exercise Cover. */}
          {onTitleClick ? (
            <button type="button" onClick={onTitleClick}>
              {title}
            </button>
          ) : (
            title
          )}
          {subtitle !== undefined && (
            <small
              data-testid="play-subtitle"
              className="ml-[10px] text-[13px] font-normal tracking-normal text-[var(--muted)]"
            >
              {subtitle}
            </small>
          )}
        </h1>
        <nav aria-label="Puzzle" className="flex gap-[6px]">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="rounded-[6px] px-[10px] py-[8px] text-[14px] font-medium hover:bg-[#f0f0f0]"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[var(--column)] px-[18px] pb-20 pt-7 text-center">
        {meta !== undefined && (
          <div data-testid="play-date" className="mb-[10px] text-[14px] text-[var(--muted)]">
            {meta}
          </div>
        )}
        {notice !== undefined && (
          <p className="mb-[16px] border-y border-[var(--line)] py-2 text-[15px]">{notice}</p>
        )}
        {children}
        <div className="mt-10 text-center text-[13px] text-[var(--muted)]">
          <Link
            href="/"
            className="text-[13px] text-[var(--muted)] underline underline-offset-[3px]"
          >
            Board at Work
          </Link>{" "}
          ·{" "}
          <button
            type="button"
            onClick={onChangeDisguise}
            className="text-[13px] text-[var(--muted)] underline underline-offset-[3px]"
          >
            Work mode
          </button>{" "}
          · Esc toggles between modes
        </div>
      </main>
    </div>
  );
}

function Prompt({ headline, tone, note }: PromptProps): React.ReactElement {
  const pending = tone === "pending";
  return (
    <div data-testid="play-prompt">
      <p
        className={
          pending
            ? "mb-[6px] min-h-[26px] text-[17px] font-normal italic leading-[1.3] text-[var(--muted)]"
            : "mb-[6px] min-h-[26px] text-[20px] font-bold leading-[1.3]"
        }
      >
        {headline}
      </p>
      {note !== undefined && (
        <p className="mb-[22px] text-[14px] text-[var(--muted)]">{note}</p>
      )}
    </div>
  );
}

function TextRun({
  items,
  ariaLabel,
  groupTokens,
  onSelect,
}: TextRunProps): React.ReactElement {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="mb-[26px] flex flex-wrap justify-center gap-[6px]"
    >
      {items.map((item) => {
        const locked = item.state === "locked";
        const token = tokenFor(item.groupId, groupTokens, locked);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            aria-label={item.ariaLabel ?? item.text}
            disabled={locked || !onSelect}
            style={{
              background: token ? `var(${token})` : "var(--paper)",
              borderColor: token ? `var(${token})` : "var(--line)",
              color: locked ? "#fff" : "var(--ink)",
            }}
            className={`flex h-[var(--tile)] w-[var(--tile)] items-center justify-center rounded-[var(--tile-radius)] border-[length:var(--tile-border)] text-[22px] font-bold transition-[background-color,border-color,transform] duration-[120ms] active:scale-[0.94] disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] ${
              item.state === "wrong" ? "bw-wrong" : ""
            }`}
          >
            {item.text}
          </button>
        );
      })}
    </div>
  );
}

function Slots({ rows, groupTokens }: SlotsProps): React.ReactElement {
  return (
    <div data-testid="play-strands" className="mb-[28px] flex flex-col items-center gap-3">
      {rows.map((row) => {
        const token = tokenFor(row.groupId, groupTokens, true);
        return (
          <div
            key={row.id}
            role="group"
            aria-label={row.ariaLabel}
            className="flex items-end gap-[5px]"
          >
            {row.slots.map((slot) => (
              <span
                key={slot.id}
                style={{ borderColor: token ? `var(${token})` : "var(--line)" }}
                className="flex h-9 w-[30px] items-end justify-center border-b-[3px] pb-[2px] text-[22px] font-bold"
              >
                {slot.value ?? ""}
              </span>
            ))}
            {/* `row.note` (the "3 / 6" count) is a Work-mode affordance: the
                reference prototype's Play strands are slots and nothing else,
                and the filled slots already carry the count. */}
            <span className="sr-only">{row.note}</span>
          </div>
        );
      })}
    </div>
  );
}

function Passes({ label, used, total }: PassesProps): React.ReactElement {
  return (
    <div
      className="mb-[18px] flex items-center justify-center gap-2 text-[14px] text-[var(--muted)]"
      aria-label={`${label}: ${String(used)} of ${String(total)} used`}
    >
      <span>{label}</span>
      <span className="flex gap-[6px]" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full border-2 border-[var(--ink)]"
            style={{ background: i < used ? "var(--ink)" : "transparent" }}
          />
        ))}
      </span>
    </div>
  );
}

function Actions({ actions }: ActionsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap justify-center gap-[10px]">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={action.variant === "primary" ? PILL_SOLID : PILL}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
  return (
    <p
      role="status"
      aria-live="polite"
      className="mt-[18px] min-h-[24px] text-[16px]"
      style={{ color: tone === "error" ? "var(--danger)" : "var(--ink)" }}
    >
      {tone === "success" && message ? "✓ " : ""}
      {message}
    </p>
  );
}

function Log({ entries, ariaLabel }: LogProps): React.ReactElement {
  return (
    <ul
      aria-label={ariaLabel}
      className="mb-[22px] flex flex-col gap-2 text-left text-[15px]"
    >
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center gap-2 border-b border-[var(--line)] pb-2"
        >
          {entry.status !== undefined && (
            <span
              aria-hidden="true"
              className="font-bold"
              style={{
                color: entry.status === "yes" ? "var(--accent-b-lock)" : "var(--danger)",
              }}
            >
              {entry.status === "yes" ? "✓" : "✗"}
            </span>
          )}
          <span className="flex-1">
            {entry.author !== undefined && (
              <strong className="mr-2 font-semibold">{entry.author}</strong>
            )}
            {entry.text}
          </span>
          {entry.status !== undefined && (
            <span className="sr-only">
              {entry.status === "yes" ? "fits the rule" : "does not fit the rule"}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Summary({ items, ariaLabel }: SummaryProps): React.ReactElement {
  return (
    <dl
      aria-label={ariaLabel}
      className="mb-[22px] grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-left text-[15px]"
    >
      {items.map((item) => (
        <div key={item.id} className="contents">
          <dt className="text-[var(--muted)]">{item.label}</dt>
          <dd className="font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
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
    <table className="mx-auto mb-[26px] border-separate border-spacing-[3px] text-center">
      <caption className="sr-only">{ariaLabel}</caption>
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => {
              const cell = cells[r * cols + c];
              if (!cell) {
                return <td key={c} />;
              }
              const flagged = cell.state === "selected" || cell.state === "locked";
              return (
                <td key={cell.id}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(cell.id)}
                    disabled={cell.state === "locked" || !onSelect}
                    aria-pressed={flagged}
                    aria-label={`Row ${String(r + 1)}, column ${String(c + 1)}: ${cell.value}${
                      flagged ? ", flagged" : ""
                    }`}
                    style={{
                      background: flagged ? "var(--accent-a)" : "var(--paper)",
                      borderColor: flagged ? "var(--accent-a-lock)" : "var(--line)",
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-[var(--tile-radius)] border-[length:var(--tile-border)] text-[16px] font-medium tabular-nums disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
                  >
                    {cell.value}
                  </button>
                </td>
              );
            })}
            {rowTotals?.[r] !== undefined && (
              <td
                className="pl-3 text-[14px] tabular-nums"
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
                className="pt-2 text-[14px] tabular-nums"
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
  );
}

function Passage({ words, onSelect }: PassageProps): React.ReactElement {
  return (
    <p className="mb-[26px] text-left text-[17px] leading-[1.7]">
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
              className="rounded-[3px] px-[2px] decoration-[var(--line)] decoration-2 underline-offset-4 hover:underline disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ink)]"
            >
              {word.text}
            </button>
            {i < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </p>
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
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/55 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="play-modal-title"
        className="skin-play relative max-h-[92vh] w-[440px] max-w-full overflow-auto rounded-[10px] bg-[var(--paper)] px-7 pb-7 pt-9 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-[10px] top-[10px] px-[10px] py-[6px] text-[22px] leading-none"
        >
          ×
        </button>
        <h2
          id="play-modal-title"
          className="mb-2 text-[28px] font-black tracking-[-0.02em]"
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: SliderProps): React.ReactElement {
  return (
    <div className="mb-[22px]">
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
        className="w-full accent-[var(--ink)]"
      />
      <div className="flex justify-between text-[13px] text-[var(--muted)]">
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
    <label className="mb-[18px] flex flex-col items-center gap-1">
      <span className="sr-only">{label}</span>
      <span className="flex items-baseline gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            onChange(Number(event.target.value));
          }}
          className="w-[220px] rounded-[6px] border border-[var(--ink)] px-3 py-2 text-center text-[34px] font-bold tabular-nums"
        />
        {unit !== undefined && unit !== "" && (
          <span className="text-[16px] text-[var(--muted)]">{unit}</span>
        )}
      </span>
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
    <div className="mb-[26px] overflow-x-auto">
      <table className="mx-auto border-separate border-spacing-[3px] text-center text-[13px]">
        <caption className="sr-only">{ariaLabel}</caption>
        <thead>
          <tr>
            <th className="sr-only">Person</th>
            {colLabels.map((col) => (
              <th
                key={col.id}
                scope="col"
                className="h-[86px] whitespace-nowrap px-1 align-bottom font-medium text-[var(--muted)]"
              >
                <span className="inline-block origin-bottom-left translate-x-3 -rotate-45 whitespace-nowrap">
                  {col.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((row) => (
            <tr key={row.id}>
              <th
                scope="row"
                className="whitespace-nowrap pr-2 text-right font-medium"
              >
                {row.label}
              </th>
              {colLabels.map((col) => {
                const cell = cellFor(row.id, col.id);
                const state = cell?.state ?? "empty";
                return (
                  <td key={col.id}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(row.id, col.id)}
                      disabled={!onSelect}
                      aria-label={`${row.label}, ${col.label}: ${state}`}
                      style={{
                        background:
                          state === "yes" ? "var(--accent-b)" : "var(--paper)",
                        borderColor:
                          state === "yes" ? "var(--accent-b-lock)" : "var(--line)",
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-[var(--tile-radius)] border-[length:var(--tile-border)] text-[16px] font-bold disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
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
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div data-testid="cover-play" className="skin-play min-h-screen">
      <header className="mx-auto flex max-w-[1100px] items-center justify-between border-b border-[var(--ink)] px-5 py-[14px]">
        <h1 className="text-[26px] font-black tracking-[-0.02em]">
          <button type="button" onClick={onExit} className="underline-offset-4 hover:underline">
            Board at Work
          </button>
        </h1>
      </header>
      <main className="mx-auto max-w-[var(--column)] px-[18px] pb-20 pt-7">
        <p className="text-[20px] font-bold">Nothing to see here.</p>
        <p className="mt-2 text-[15px] text-[var(--muted)]">
          Click the wordmark to go back to the puzzle.
        </p>
      </main>
    </div>
  );
}

const FAVICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='11' fill='#121212'/><text x='12' y='17' font-size='14' font-family='Georgia' font-weight='700' fill='#F9DF6D' text-anchor='middle'>B</text></svg>";

function Icon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#121212" />
      <text
        x="12"
        y="17"
        fontSize="14"
        fontFamily="Georgia, serif"
        fontWeight="700"
        fill="#F9DF6D"
        textAnchor="middle"
      >
        B
      </text>
    </svg>
  );
}

export const playSkin: SkinPrimitives = {
  id: "play",
  displayName: "Play",
  Icon,
  faviconHref: svgFavicon(FAVICON_SVG),
  tabTitle: "Board at Work",
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
