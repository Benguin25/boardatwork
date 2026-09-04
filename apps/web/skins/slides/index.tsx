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
  SlotItem,
  SlotsProps,
  TextRunProps,
  TileRowProps,
  UnitState,
} from "@/components/primitives/types";

/**
 * Slides skin (SPEC §3.1): a Google-Slides-style deck editor disguise — a
 * yellow toolbar, a static filmstrip of slide thumbnails down the left, one
 * 16:9 "slide" surface where puzzle content sits like text boxes and shapes,
 * and speaker-notes-styled panels for feedback/history. Behaviourally this
 * mirrors the Play reference skin; only the visual language differs.
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#ffffff",
  ["--accent-a" as string]: "#fbbc04",
  ["--accent-b" as string]: "#34a853",
  ["--accent-c" as string]: "#4285f4",
  ["--text" as string]: "#202124",
  ["--bg" as string]: "#f1f3f4",
  ["--border" as string]: "#dadce0",
  fontFamily: '"Google Sans", "Segoe UI", Roboto, Arial, ui-sans-serif, system-ui, sans-serif',
};

const WRONG_BORDER = "#d93025";
const WRONG_BG = "#fce8e6";
const CORRECT_BORDER = "#188038";

/**
 * Shared per-unit styling for every addressable puzzle unit (letter tile,
 * grid cell, passage word, ...). Color is never the only signal: state also
 * changes border style/width, font weight, and text decoration.
 */
function unitStyle(state: UnitState | undefined, token: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: token ? `var(${token})` : "var(--tile-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontWeight: 400,
  };
  if (state === "wrong") {
    base.background = WRONG_BG;
    base.border = `1px solid ${WRONG_BORDER}`;
    base.textDecoration = "line-through";
  } else if (state === "correct") {
    base.border = `1px solid ${CORRECT_BORDER}`;
    base.fontWeight = 700;
    base.textDecoration = "underline";
  } else if (state === "locked") {
    base.borderWidth = "3px";
    base.borderStyle = "double";
    base.fontWeight = 700;
  } else if (state === "selected") {
    base.border = "2px dashed var(--accent-c)";
    base.fontWeight = 600;
  }
  return base;
}

function slotStyle(slot: SlotItem): React.CSSProperties {
  const style = unitStyle(slot.state, undefined);
  if (!slot.value && (slot.state === undefined || slot.state === "default")) {
    style.borderStyle = "dashed";
  }
  return style;
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="flex items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-2">
        <span aria-hidden="true" className="text-xl leading-none">
          🖼️
        </span>
        <h1 className="text-base font-medium">
          {onTitleClick ? (
            <button
              type="button"
              onClick={onTitleClick}
              className="rounded px-1.5 py-0.5 hover:bg-[var(--bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-c)]"
            >
              {title}
            </button>
          ) : (
            title
          )}
        </h1>
        <nav aria-hidden="true" className="ml-2 hidden gap-3 text-xs text-neutral-500 sm:flex">
          <span>File</span>
          <span>Edit</span>
          <span>Insert</span>
          <span>View</span>
        </nav>
        <div
          aria-hidden="true"
          className="ml-auto rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: "var(--accent-a)", color: "#202124" }}
        >
          Present
        </div>
      </header>
      <div className="flex gap-4 p-4">
        <aside aria-hidden="true" className="hidden w-20 shrink-0 flex-col gap-2 sm:flex">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-video rounded"
              style={{
                border: i === 0 ? "2px solid var(--accent-c)" : "1px solid var(--border)",
                background: "var(--tile-bg)",
              }}
            />
          ))}
        </aside>
        <main className="min-w-0 flex-1">
          <div
            className="mx-auto flex w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--tile-bg)] p-6 shadow-sm"
            style={{ aspectRatio: "16 / 9" }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function TextRun({ items, groupTokens, onSelect }: TextRunProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Letters">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          aria-label={item.ariaLabel ?? item.text}
          aria-pressed={item.state === "selected"}
          disabled={!onSelect}
          style={unitStyle(item.state, item.groupId ? groupTokens?.[item.groupId] : undefined)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-lg uppercase shadow-sm disabled:cursor-default"
        >
          {item.text}
        </button>
      ))}
    </div>
  );
}

function TileRow({ rows, groupTokens, onSelect }: TileRowProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          {row.label !== undefined && (
            <span className="w-20 shrink-0 rounded bg-[var(--bg)] px-1.5 py-0.5 text-xs font-medium text-neutral-600">
              {row.label}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={row.label ?? "Row"}>
            {row.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect?.(row.id, item.id)}
                aria-label={item.ariaLabel ?? item.text}
                disabled={!onSelect}
                style={unitStyle(item.state, item.groupId ? groupTokens?.[item.groupId] : undefined)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-base uppercase shadow-sm disabled:cursor-default"
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Slots({ slots, onSelect }: SlotsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Answer slots">
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          onClick={() => onSelect?.(slot.id)}
          aria-label={slot.value ?? slot.placeholder ?? "Empty slot"}
          disabled={!onSelect}
          style={slotStyle(slot)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-lg shadow-sm disabled:cursor-default"
        >
          {slot.value ?? ""}
        </button>
      ))}
    </div>
  );
}

function Grid({ rows, cols, cells, rowTotals, colTotals, onSelect }: GridProps): React.ReactElement {
  return (
    <table className="border-collapse text-center">
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => {
              const cell = cells[r * cols + c];
              if (!cell) return <td key={c} />;
              return (
                <td key={cell.id} className="p-0.5">
                  <button
                    type="button"
                    onClick={() => onSelect?.(cell.id)}
                    disabled={!onSelect}
                    aria-label={`Row ${String(r + 1)}, column ${String(c + 1)}: ${cell.value}`}
                    style={unitStyle(cell.state, undefined)}
                    className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium shadow-sm disabled:cursor-default"
                  >
                    {cell.value}
                  </button>
                </td>
              );
            })}
            {rowTotals && (
              <td
                className="pl-2 text-sm font-semibold text-neutral-600"
                aria-label={`Row ${String(r + 1)} total`}
              >
                {rowTotals[r]}
              </td>
            )}
          </tr>
        ))}
        {colTotals && (
          <tr>
            {colTotals.map((total, c) => (
              <td
                key={c}
                className="pt-1 text-sm font-semibold text-neutral-600"
                aria-label={`Column ${String(c + 1)} total`}
              >
                {total}
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
    <p
      className="rounded-md border border-dashed border-[var(--border)] p-3 text-base leading-relaxed"
      style={{ background: "var(--tile-bg)" }}
    >
      {words.map((word, i) => (
        <span key={word.id}>
          <button
            type="button"
            onClick={() => onSelect?.(word.id)}
            disabled={!onSelect}
            style={unitStyle(word.state, undefined)}
            className="rounded px-1 py-0.5 disabled:cursor-default"
          >
            {word.text}
          </button>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </p>
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
            className="h-2.5 w-2.5 rounded-full border"
            style={{
              borderColor: "var(--border)",
              background: i < used ? "var(--accent-a)" : "transparent",
            }}
          />
        ))}
      </span>
      <span aria-hidden="true" className="text-xs text-neutral-500">
        {used}/{total}
      </span>
    </div>
  );
}

function Actions({ actions }: ActionsProps): React.ReactElement {
  return (
    <div
      className="flex w-fit flex-wrap gap-1.5 rounded-full border border-[var(--border)] bg-white p-1.5 shadow-sm"
      role="toolbar"
      aria-label="Toolbar"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          style={action.variant === "secondary" ? undefined : { background: "var(--accent-c)" }}
          className={
            action.variant === "secondary"
              ? "rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium disabled:opacity-40"
              : "rounded-full px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          }
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
  const borderColor = tone === "error" ? WRONG_BORDER : tone === "success" ? CORRECT_BORDER : "var(--border)";
  const prefix = tone === "error" ? "✗ " : tone === "success" ? "✓ " : "";
  return (
    <p
      role="status"
      aria-live="polite"
      className="rounded-md border-l-4 px-3 py-2 text-sm italic"
      style={{ borderColor, background: "var(--bg)" }}
    >
      <span aria-hidden="true">{prefix}</span>
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  return (
    <ul
      className="flex flex-col gap-1 rounded-md p-3 text-sm"
      style={{ background: "var(--bg)" }}
      aria-label="Speaker notes history"
    >
      {entries.map((entry) => (
        <li key={entry.id}>
          {entry.author !== undefined && <strong>{entry.author}: </strong>}
          {entry.text}
        </li>
      ))}
    </ul>
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
        aria-labelledby="slides-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-[var(--border)] bg-white p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="slides-modal-title" className="text-lg font-medium">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-xl leading-none hover:bg-[var(--bg)]"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, unit, onChange }: SliderProps): React.ReactElement {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      <span>
        {label}: {value}
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
        className="w-full accent-[var(--accent-c)]"
      />
    </label>
  );
}

function LogicGrid({ rowLabels, colLabels, cells, onSelect }: LogicGridProps): React.ReactElement {
  const cellFor = (rowId: string, colId: string) =>
    cells.find((cell) => cell.rowId === rowId && cell.colId === colId);
  return (
    <table className="border-collapse text-center text-sm">
      <thead>
        <tr>
          <th className="sr-only">Row / column</th>
          {colLabels.map((col) => (
            <th key={col.id} className="px-1 pb-1 font-medium text-neutral-600">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rowLabels.map((row) => (
          <tr key={row.id}>
            <th scope="row" className="pr-2 text-right font-medium text-neutral-600">
              {row.label}
            </th>
            {colLabels.map((col) => {
              const cell = cellFor(row.id, col.id);
              const glyph = cell?.state === "yes" ? "✓" : cell?.state === "no" ? "✗" : "";
              return (
                <td key={col.id} className="p-0.5">
                  <button
                    type="button"
                    onClick={() => onSelect?.(row.id, col.id)}
                    disabled={!onSelect}
                    aria-label={`${row.label}, ${col.label}: ${cell?.state ?? "empty"}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--tile-bg)] font-bold shadow-sm disabled:cursor-default"
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
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="flex items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-2">
        <span aria-hidden="true" className="text-xl leading-none">
          🖼️
        </span>
        <h1 className="text-base font-medium">Untitled presentation</h1>
        <button
          type="button"
          onClick={onExit}
          className="ml-auto rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium hover:bg-[var(--bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-c)]"
        >
          Exit
        </button>
      </header>
      <main className="p-4">
        <div
          className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--tile-bg)] p-6 text-center shadow-sm"
          style={{ aspectRatio: "16 / 9" }}
        >
          <p className="text-2xl text-neutral-400">Click to add title</p>
          <p className="text-base text-neutral-400">Click to add subtitle</p>
        </div>
      </main>
    </div>
  );
}

export const slidesSkin: SkinPrimitives = {
  id: "slides",
  displayName: "Slides",
  favicon: "🖼️",
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
