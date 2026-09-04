"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type {
  ActionsProps,
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
import { RailContext, useRailSlot } from "../shared/rail";

/**
 * Shared primitive implementations for the disguises whose chrome, not
 * whose typography, is the disguise. Every visual decision here reads from
 * the skin root's CSS variables, so a skin is "tokens + chrome + cover".
 * Play and Docs are hand-built instead, because they are held to the
 * reference prototype pixel for pixel.
 *
 * Nothing in this file knows which game is rendering: `variant` describes
 * how the *app* draws an addressable unit, never which puzzle it holds.
 */
export type UnitVariant = "tile" | "highlight" | "cell" | "mono";

export interface KitConfig {
  /** Root class carrying this skin's tokens, e.g. `skin-slack`. */
  variant: UnitVariant;
  /** Accessible/visual label prefix for the modal's heading id. */
  idPrefix: string;
}

/** The primitives a kit-based skin gets for free. */
export type KitPrimitives = Pick<
  SkinPrimitives,
  | "Prompt"
  | "TextRun"
  | "Slots"
  | "Grid"
  | "Passage"
  | "Passes"
  | "Actions"
  | "Feedback"
  | "Log"
  | "Summary"
  | "Modal"
  | "Slider"
  | "NumberField"
  | "LogicGrid"
>;

function groupVar(
  groupId: string | undefined,
  groupTokens: Readonly<Record<string, string>> | undefined,
  locked: boolean,
): string | undefined {
  const base = groupId ? groupTokens?.[groupId] : undefined;
  if (!base) {
    return undefined;
  }
  return `var(${locked ? `${base}-lock` : base})`;
}

const UNIT_CLASS: Record<UnitVariant, string> = {
  tile: "flex h-11 min-w-11 items-center justify-center rounded-md border-2 border-[var(--line)] px-2 text-lg font-bold",
  highlight: "inline-block min-w-6 rounded-sm px-1 text-center text-lg leading-8",
  cell: "flex h-9 min-w-11 items-center justify-center border border-[var(--line)] px-2 text-base font-medium tabular-nums",
  mono: "inline-block min-w-6 px-1 text-center font-mono text-lg",
};

const SLOT_CLASS: Record<UnitVariant, string> = {
  tile: "flex h-10 w-8 items-end justify-center border-b-[3px] pb-0.5 text-lg font-bold",
  highlight: "inline-block h-6 w-5 border-b border-current text-center",
  cell: "flex h-8 w-9 items-center justify-center border border-[var(--line)] text-base font-medium",
  mono: "inline-block w-5 border-b border-current text-center font-mono",
};

export function createKitPrimitives(config: KitConfig): KitPrimitives {
  const { variant, idPrefix } = config;

  function Prompt({ headline, tone, note }: PromptProps): React.ReactElement {
    return (
      <div className="mb-4">
        <p
          className={
            tone === "pending"
              ? "text-base italic text-[var(--muted)]"
              : "text-lg font-semibold leading-snug"
          }
        >
          {headline}
        </p>
        {note !== undefined && (
          <p className="mt-1 text-sm text-[var(--muted)]">{note}</p>
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
        className={
          variant === "tile"
            ? "mb-5 flex flex-wrap gap-1.5"
            : "mb-5 leading-loose tracking-wide"
        }
      >
        {items.map((item) => {
          const locked = item.state === "locked";
          const fill = groupVar(item.groupId, groupTokens, locked);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              aria-label={item.ariaLabel ?? item.text}
              disabled={locked || !onSelect}
              style={{
                background: fill ?? "transparent",
                borderColor: fill,
                fontWeight: locked ? 700 : undefined,
                color: locked && variant === "tile" ? "#fff" : undefined,
                textDecoration:
                  item.state === "wrong" ? "underline wavy var(--danger)" : undefined,
              }}
              className={`${UNIT_CLASS[variant]} ${
              onSelect && !locked ? "hover:outline hover:outline-1 hover:outline-[var(--brand)]" : ""
            } disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]`}
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
      <ul className="mb-5 flex flex-col gap-2">
        {rows.map((row) => {
          const fill = groupVar(row.groupId, groupTokens, true);
          const soft = groupVar(row.groupId, groupTokens, false);
          return (
            <li key={row.id} aria-label={row.ariaLabel} className="flex items-end gap-1">
              {row.slots.map((slot) => (
                <span
                  key={slot.id}
                  style={{
                    borderColor: fill ?? "var(--line)",
                    background: variant === "tile" ? undefined : soft,
                  }}
                  className={SLOT_CLASS[variant]}
                >
                  {slot.value ?? ""}
                </span>
              ))}
              {row.note !== undefined && (
                <span className="ml-2 text-xs text-[var(--muted)]">{row.note}</span>
              )}
            </li>
          );
        })}
      </ul>
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
      <div className="relative mb-5 overflow-x-auto">
        <table className="border-collapse text-center text-sm">
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
                          fontWeight: cell.state === "locked" ? 700 : undefined,
                        }}
                        className="flex h-8 w-16 items-center justify-end px-2 tabular-nums disabled:cursor-default"
                      >
                        {cell.value}
                      </button>
                    </td>
                  );
                })}
                {rowTotals?.[r] !== undefined && (
                  <td
                    className="px-2 text-sm tabular-nums"
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
                    className="pt-1 text-sm tabular-nums"
                    style={{
                      color: total.reconciled ? "var(--muted)" : "var(--danger)",
                    }}
                  >
                    {total.value}
                    {!total.reconciled && (
                      <span className="sr-only"> does not reconcile</span>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function Passage({ words, onSelect }: PassageProps): React.ReactElement {
    return (
      <p
        className={
          variant === "mono"
            ? "mb-5 font-mono text-sm leading-7"
            : "mb-5 text-[17px] leading-[1.7]"
        }
      >
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
                  fontWeight: word.state === "locked" ? 700 : undefined,
                }}
                className="rounded-sm px-0.5 decoration-[var(--line)] decoration-2 underline-offset-4 hover:underline disabled:cursor-default"
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

  function Passes({ label, used, total }: PassesProps): React.ReactElement {
    const slot = useRailSlot("passes");
    const body = (
      <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span>{label}</span>
        <span className="flex gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full border border-[var(--muted)]"
              style={{ background: i < used ? "var(--muted)" : "transparent" }}
            />
          ))}
        </span>
        <span className="sr-only">
          : {used} of {total} used
        </span>
      </p>
    );
    if (!slot) {
      return <div className="mb-4">{body}</div>;
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
                ? "rounded-md bg-[var(--brand)] px-3.5 py-2 text-sm font-semibold text-[var(--brand-ink)] disabled:opacity-40"
                : "rounded-md border border-[var(--line)] px-3.5 py-2 text-sm font-semibold text-[var(--ink)] disabled:opacity-40"
            }
          >
            {action.label}
          </button>
        ))}
      </>
    );
    if (!slot) {
      return <div className="flex flex-wrap gap-2">{body}</div>;
    }
    return createPortal(body, slot);
  }

  function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
    const slot = useRailSlot("feedback");
    const body = (
      <p
        role="status"
        aria-live="polite"
        className="min-h-6 text-sm"
        style={{ color: tone === "error" ? "var(--danger)" : "var(--ink)" }}
      >
        {message}
      </p>
    );
    if (!slot) {
      return <div className="mt-4">{body}</div>;
    }
    return createPortal(body, slot);
  }

  function Log({ entries, ariaLabel }: LogProps): React.ReactElement {
    return (
      <ul aria-label={ariaLabel} className="mb-5 flex flex-col gap-1.5 text-sm">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-2 border-b border-[var(--line)] pb-1.5"
          >
            {entry.status !== undefined && (
              <span
                aria-hidden="true"
                className="font-bold"
                style={{
                  color:
                    entry.status === "yes" ? "var(--accent-b-lock)" : "var(--danger)",
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
        className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm"
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
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            ref={cardRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${idPrefix}-modal-title`}
            className="max-h-[85vh] w-[440px] max-w-full overflow-auto rounded-lg border border-[var(--line)] bg-[var(--paper)] p-6 text-sm text-[var(--ink)] shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id={`${idPrefix}-modal-title`} className="text-lg font-semibold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded px-2 text-xl leading-none hover:bg-black/10"
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
      <div className="mb-4">
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
          className="w-full accent-[var(--brand)]"
        />
        <div className="flex justify-between text-xs text-[var(--muted)]">
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
      <label className="mb-4 flex items-baseline gap-2">
        <span className="sr-only">{label}</span>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            onChange(Number(event.target.value));
          }}
          className="w-[200px] rounded-md border border-[var(--line)] px-3 py-2 text-2xl font-bold tabular-nums"
        />
        {unit !== undefined && unit !== "" && (
          <span className="text-sm text-[var(--muted)]">{unit}</span>
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
      <div className="relative mb-5 overflow-x-auto">
        <table className="border-collapse text-center text-xs">
          <caption className="sr-only">{ariaLabel}</caption>
          <thead>
            <tr>
              <th className="sr-only">Person</th>
              {colLabels.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className="border border-[var(--line)] px-1.5 py-1 font-medium text-[var(--muted)]"
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
                  className="whitespace-nowrap border border-[var(--line)] px-2 text-right font-medium"
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
    );
  }

  return {
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
  };
}
