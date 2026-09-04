"use client";

import type {
  ActionsProps,
  ChromeProps,
  FeedbackProps,
  GridProps,
  LogProps,
  LogicGridProps,
  ModalProps,
  PassageProps,
  PassesProps,
  SkinPrimitives,
  SliderProps,
  SlotsProps,
  TextRunProps,
  TileRowProps,
  UnitState,
} from "@/components/primitives/types";

/**
 * Sheets skin: a Google-Sheets-flavoured disguise (SPEC persona: Sheets).
 * Column-letter / row-number headers, a formula-bar strip, toolbar-style
 * actions, and a "Comments" side panel for `Log`/`Feedback`. Everything is
 * data-driven off `SkinPrimitives` props — no game-specific content here.
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#ffffff",
  ["--accent-a" as string]: "#34a853",
  ["--accent-b" as string]: "#fbbc04",
  ["--accent-c" as string]: "#4285f4",
  ["--text" as string]: "#202124",
  ["--bg" as string]: "#ffffff",
  ["--border" as string]: "#c0c0c0",
  ["--line" as string]: "#e1e3e6",
  ["--header-bg" as string]: "#f8f9fa",
  ["--selected" as string]: "#1a73e8",
  ["--correct-bg" as string]: "#e6f4ea",
  ["--wrong-bg" as string]: "#fce8e6",
  ["--locked-bg" as string]: "#f1f3f4",
  fontFamily:
    '"Google Sans", Roboto, Arial, ui-sans-serif, system-ui, sans-serif',
};

/** A1-style column label: 0 -> A, 25 -> Z, 26 -> AA, ... */
function columnLabel(index: number): string {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

function unitStyle(state: UnitState | undefined, token: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: token ? `var(${token})` : "var(--tile-bg)",
    border: "1px solid var(--line)",
    color: "var(--text)",
    fontWeight: 400,
  };
  if (state === "selected") {
    base.border = "2px solid var(--selected)";
    base.boxShadow = "inset 0 0 0 1px var(--selected)";
    base.fontWeight = 600;
  } else if (state === "correct") {
    base.background = token ? `var(${token})` : "var(--correct-bg)";
    base.border = "1px solid var(--accent-a)";
    base.fontWeight = 700;
  } else if (state === "wrong") {
    base.background = token ? `var(${token})` : "var(--wrong-bg)";
    base.textDecoration = "line-through";
    base.borderStyle = "dashed";
  } else if (state === "locked") {
    base.background = token ? `var(${token})` : "var(--locked-bg)";
    base.fontWeight = 700;
    base.borderStyle = "double";
    base.borderWidth = "3px";
  }
  return base;
}

/** Small aria-hidden glyph mirroring state so colour is never the only signal. */
function stateGlyph(state: UnitState | undefined): string | null {
  if (state === "correct") return "✓";
  if (state === "wrong") return "✕";
  if (state === "locked") return "🔒";
  return null;
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)]">
        <div className="flex items-center gap-2 px-4 py-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--accent-a)] text-base font-bold text-white"
          >
            ▦
          </span>
          <h1 className="min-w-0 truncate text-base font-normal">
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className="rounded px-1.5 py-1 underline-offset-4 hover:bg-[var(--header-bg)] hover:underline"
              >
                {title}
              </button>
            ) : (
              <span className="px-1.5 py-1">{title}</span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--header-bg)] px-4 py-1.5 text-sm">
          <span aria-hidden="true" className="italic text-[#1a56db]">
            fx
          </span>
          <span className="min-w-0 truncate text-[var(--text)]">{title}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}

function TextRun({ items, groupTokens, onSelect }: TextRunProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-0.5" role="group" aria-label="Letters">
      {items.map((item) => {
        const glyph = stateGlyph(item.state);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            aria-label={item.ariaLabel ?? item.text}
            aria-pressed={item.state === "selected"}
            disabled={!onSelect}
            style={unitStyle(item.state, item.groupId ? groupTokens?.[item.groupId] : undefined)}
            className="relative flex h-10 w-10 items-center justify-center text-lg uppercase disabled:cursor-default"
          >
            {item.text}
            {glyph && (
              <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 text-[9px] leading-none">
                {glyph}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TileRow({ rows, groupTokens, onSelect }: TileRowProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-0.5" aria-label="Rows">
      {rows.map((row, rowIndex) => (
        <div key={row.id} className="flex items-stretch gap-0.5">
          <span className="flex w-20 shrink-0 items-center justify-end bg-[var(--header-bg)] px-2 text-xs font-medium text-[var(--text)]">
            {row.label ?? String(rowIndex + 1)}
          </span>
          <div className="flex flex-wrap gap-0.5" role="group" aria-label={row.label ?? "Row"}>
            {row.items.map((item) => {
              const glyph = stateGlyph(item.state);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect?.(row.id, item.id)}
                  aria-label={item.ariaLabel ?? item.text}
                  disabled={!onSelect}
                  style={unitStyle(item.state, item.groupId ? groupTokens?.[item.groupId] : undefined)}
                  className="relative flex h-9 w-9 items-center justify-center text-base uppercase disabled:cursor-default"
                >
                  {item.text}
                  {glyph && (
                    <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 text-[9px] leading-none">
                      {glyph}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Slots({ slots, onSelect }: SlotsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-0.5" role="group" aria-label="Answer slots">
      {slots.map((slot) => {
        const glyph = stateGlyph(slot.state);
        const style = unitStyle(slot.state, undefined);
        if (slot.value === null && !slot.state) {
          style.borderStyle = "dashed";
        }
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onSelect?.(slot.id)}
            aria-label={slot.value ?? slot.placeholder ?? "Empty slot"}
            disabled={!onSelect}
            style={style}
            className="relative flex h-10 w-10 items-center justify-center text-lg disabled:cursor-default"
          >
            {slot.value ?? ""}
            {glyph && (
              <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 text-[9px] leading-none">
                {glyph}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Grid({ rows, cols, cells, rowTotals, colTotals, onSelect }: GridProps): React.ReactElement {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-center text-sm">
        <caption className="sr-only">Puzzle grid</caption>
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              Row header
            </th>
            {Array.from({ length: cols }, (_, c) => (
              <th
                key={c}
                scope="col"
                className="border border-[var(--line)] bg-[var(--header-bg)] px-1 py-1 font-medium text-[var(--text)]"
              >
                {columnLabel(c)}
              </th>
            ))}
            {colTotals && (
              <th
                scope="col"
                className="border border-[var(--line)] bg-[var(--header-bg)] px-2 py-1 font-medium text-[var(--text)]"
              >
                Total
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              <th
                scope="row"
                className="border border-[var(--line)] bg-[var(--header-bg)] px-2 py-1 font-medium text-[var(--text)]"
              >
                {r + 1}
              </th>
              {Array.from({ length: cols }, (_, c) => {
                const cell = cells[r * cols + c];
                if (!cell) return <td key={c} className="border border-[var(--line)]" />;
                const glyph = stateGlyph(cell.state);
                return (
                  <td key={cell.id} className="border border-[var(--line)] p-0">
                    <button
                      type="button"
                      onClick={() => onSelect?.(cell.id)}
                      disabled={!onSelect}
                      aria-label={`${columnLabel(c)}${String(r + 1)}: ${cell.value}`}
                      style={unitStyle(cell.state, undefined)}
                      className="relative flex h-10 w-10 items-center justify-center font-medium disabled:cursor-default"
                    >
                      {cell.value}
                      {glyph && (
                        <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 text-[9px] leading-none">
                          {glyph}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
              {rowTotals && (
                <td
                  className="border border-[var(--line)] bg-[var(--header-bg)] px-2 py-1 font-semibold text-[var(--text)]"
                  aria-label={`Row ${String(r + 1)} total`}
                >
                  {rowTotals[r]}
                </td>
              )}
            </tr>
          ))}
          {colTotals && (
            <tr>
              <th scope="row" className="border border-[var(--line)] bg-[var(--header-bg)] px-2 py-1 font-medium text-[var(--text)]">
                Total
              </th>
              {colTotals.map((total, c) => (
                <td
                  key={c}
                  className="border border-[var(--line)] bg-[var(--header-bg)] px-2 py-1 font-semibold text-[var(--text)]"
                  aria-label={`Column ${columnLabel(c)} total`}
                >
                  {total}
                </td>
              ))}
              {rowTotals && <td className="border border-[var(--line)] bg-[var(--header-bg)]" />}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Passage({ words, onSelect }: PassageProps): React.ReactElement {
  return (
    <div className="border border-[var(--line)] bg-[var(--tile-bg)] p-3">
      <p className="text-sm leading-relaxed">
        {words.map((word, i) => {
          const glyph = stateGlyph(word.state);
          return (
            <span key={word.id}>
              <button
                type="button"
                onClick={() => onSelect?.(word.id)}
                disabled={!onSelect}
                style={unitStyle(word.state, undefined)}
                className="relative rounded-none px-0.5 disabled:cursor-default"
              >
                {word.text}
                {glyph && (
                  <span aria-hidden="true" className="ml-0.5 text-[9px]">
                    {glyph}
                  </span>
                )}
              </button>
              {i < words.length - 1 ? " " : null}
            </span>
          );
        })}
      </p>
    </div>
  );
}

function Passes({ label, used, total }: PassesProps): React.ReactElement {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      aria-label={`${label}: ${String(used)} of ${String(total)} used`}
    >
      <span className="font-medium">{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-3 w-3 border border-[var(--border)]"
            style={{ background: i < used ? "var(--accent-a)" : "var(--tile-bg)" }}
          />
        ))}
      </span>
      <span className="text-xs text-[var(--text)]/70">
        ({used}/{total})
      </span>
    </div>
  );
}

function Actions({ actions }: ActionsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5 border border-[var(--line)] bg-[var(--header-bg)] p-1.5">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.variant === "secondary"
              ? "rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--header-bg)] disabled:opacity-40"
              : "rounded bg-[var(--accent-a)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          }
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
  const glyph = tone === "error" ? "⚠" : tone === "success" ? "✓" : "ℹ";
  const color = tone === "error" ? "#c5221f" : tone === "success" ? "#188038" : "var(--text)";
  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 border-l-4 bg-[var(--header-bg)] px-3 py-2 text-sm font-medium"
      style={{ color, borderLeftColor: color }}
    >
      <span aria-hidden="true">{glyph}</span>
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  return (
    <div className="border border-[var(--line)]">
      <div className="border-b border-[var(--line)] bg-[var(--header-bg)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
        Comments
      </div>
      <ul className="flex flex-col gap-2 p-3 text-sm" aria-label="Comments">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-start gap-2 border-l-2 border-[var(--accent-c)] pl-2">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-c)] text-xs font-bold text-white"
            >
              {(entry.author ?? "?").charAt(0).toUpperCase()}
            </span>
            <span>
              {entry.author !== undefined && <strong>{entry.author}: </strong>}
              {entry.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Modal({ open, title, onClose, children }: ModalProps): React.ReactElement | null {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheets-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded border border-[var(--border)] bg-[var(--bg)] shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--header-bg)] px-5 py-3">
          <h2 id="sheets-modal-title" className="text-base font-medium text-[var(--text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded text-lg leading-none hover:bg-[var(--bg)]"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, unit, onChange }: SliderProps): React.ReactElement {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        <span aria-hidden="true" className="italic text-[#1a56db]">
          fx{" "}
        </span>
        {label} = {value}
        {unit ?? ""}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        className="w-full accent-[var(--accent-a)]"
      />
    </label>
  );
}

function LogicGrid({ rowLabels, colLabels, cells, onSelect }: LogicGridProps): React.ReactElement {
  const cellFor = (rowId: string, colId: string) =>
    cells.find((cell) => cell.rowId === rowId && cell.colId === colId);
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-center text-sm">
        <caption className="sr-only">Logic grid</caption>
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              Row / column
            </th>
            {colLabels.map((col) => (
              <th
                key={col.id}
                scope="col"
                className="border border-[var(--line)] bg-[var(--header-bg)] px-2 py-1 font-medium text-[var(--text)]"
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
                className="border border-[var(--line)] bg-[var(--header-bg)] px-2 py-1 text-right font-medium text-[var(--text)]"
              >
                {row.label}
              </th>
              {colLabels.map((col) => {
                const cell = cellFor(row.id, col.id);
                const glyph = cell?.state === "yes" ? "✓" : cell?.state === "no" ? "✕" : "";
                const bg =
                  cell?.state === "yes" ? "var(--correct-bg)" : cell?.state === "no" ? "var(--wrong-bg)" : "var(--tile-bg)";
                return (
                  <td key={col.id} className="border border-[var(--line)] p-0">
                    <button
                      type="button"
                      onClick={() => onSelect?.(row.id, col.id)}
                      disabled={!onSelect}
                      aria-label={`${row.label}, ${col.label}: ${cell?.state ?? "empty"}`}
                      style={{ background: bg }}
                      className="flex h-9 w-9 items-center justify-center font-bold text-[var(--text)] disabled:cursor-default"
                    >
                      {glyph}
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
  const blankCols = 8;
  const blankRows = 14;
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)]">
        <div className="flex items-center gap-2 px-4 py-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--accent-a)] text-base font-bold text-white"
          >
            ▦
          </span>
          <h1 className="text-base font-normal">
            <button
              type="button"
              onClick={onExit}
              className="rounded px-1.5 py-1 underline-offset-4 hover:bg-[var(--header-bg)] hover:underline"
            >
              Untitled spreadsheet
            </button>
          </h1>
        </div>
        <div className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--header-bg)] px-4 py-1.5 text-sm">
          <span aria-hidden="true" className="italic text-[#1a56db]">
            fx
          </span>
          <span className="text-[var(--text)]/50">&nbsp;</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="overflow-x-auto">
          <table className="border-collapse text-center text-sm">
            <caption className="sr-only">Blank spreadsheet</caption>
            <thead>
              <tr>
                <th scope="col" className="sr-only">
                  Row header
                </th>
                {Array.from({ length: blankCols }, (_, c) => (
                  <th
                    key={c}
                    scope="col"
                    className="border border-[var(--line)] bg-[var(--header-bg)] px-1 py-1 font-medium text-[var(--text)]"
                  >
                    {columnLabel(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: blankRows }, (_, r) => (
                <tr key={r}>
                  <th
                    scope="row"
                    className="border border-[var(--line)] bg-[var(--header-bg)] px-2 py-1 font-medium text-[var(--text)]"
                  >
                    {r + 1}
                  </th>
                  {Array.from({ length: blankCols }, (_, c) => (
                    <td key={c} className="h-8 w-16 border border-[var(--line)] bg-[var(--tile-bg)]" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export const sheetsSkin: SkinPrimitives = {
  id: "sheets",
  displayName: "Sheets",
  favicon: "📊",
  Chrome,
  TextRun,
  TileRow,
  Slots,
  Grid,
  Passage,
  Passes,
  Actions,
  Feedback,
  Log,
  Modal,
  Slider,
  LogicGrid,
  Cover,
};
