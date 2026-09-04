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
 * Play skin (SPEC §3.1): the "newspaper games" reference look — thin black
 * rules, a centred column, square tiles that fill with colour, black pill
 * buttons, dot counters. This is the skin every other disguise is checked
 * against for behaviour parity.
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#f4f4f0",
  ["--accent-a" as string]: "#facc15",
  ["--accent-b" as string]: "#4ade80",
  ["--accent-c" as string]: "#60a5fa",
  ["--text" as string]: "#111111",
  ["--bg" as string]: "#ffffff",
  ["--border" as string]: "#111111",
  fontFamily:
    '"Libre Franklin", ui-sans-serif, system-ui, -apple-system, sans-serif',
};

function unitStyle(state: UnitState | undefined, token: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: token ? `var(${token})` : "var(--tile-bg)",
    border: "2px solid var(--border)",
    color: "var(--text)",
  };
  if (state === "wrong") {
    base.background = "#fecaca";
    base.textDecoration = "line-through";
  } else if (state === "correct") {
    base.fontWeight = 700;
  } else if (state === "locked") {
    base.fontWeight = 700;
    base.borderStyle = "double";
  } else if (state === "selected") {
    base.outline = "3px solid var(--text)";
  }
  return base;
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b-2 border-[var(--border)] py-4">
        <div className="mx-auto flex max-w-[560px] items-center justify-between px-4">
          <h1 className="text-lg font-bold tracking-tight">
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className="underline-offset-4 hover:underline"
              >
                {title}
              </button>
            ) : (
              title
            )}
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-[560px] px-4 py-6">{children}</main>
    </div>
  );
}

function TextRun({ items, groupTokens, onSelect }: TextRunProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Letters">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          aria-label={item.ariaLabel ?? item.text}
          aria-pressed={item.state === "selected"}
          disabled={!onSelect}
          style={unitStyle(item.state, item.groupId ? groupTokens?.[item.groupId] : undefined)}
          className="flex h-10 w-10 items-center justify-center rounded text-lg font-semibold uppercase disabled:cursor-default"
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
            <span className="w-20 shrink-0 text-sm font-medium">{row.label}</span>
          )}
          <div className="flex flex-wrap gap-1" role="group" aria-label={row.label ?? "Row"}>
            {row.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect?.(row.id, item.id)}
                aria-label={item.ariaLabel ?? item.text}
                disabled={!onSelect}
                style={unitStyle(item.state, item.groupId ? groupTokens?.[item.groupId] : undefined)}
                className="flex h-9 w-9 items-center justify-center rounded text-base font-semibold uppercase disabled:cursor-default"
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
    <div className="flex flex-wrap gap-1" role="group" aria-label="Answer slots">
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          onClick={() => onSelect?.(slot.id)}
          aria-label={slot.value ?? slot.placeholder ?? "Empty slot"}
          disabled={!onSelect}
          style={unitStyle(slot.state, undefined)}
          className="flex h-10 w-10 items-center justify-center rounded text-lg font-semibold disabled:cursor-default"
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
                    className="flex h-10 w-10 items-center justify-center rounded text-sm font-medium disabled:cursor-default"
                  >
                    {cell.value}
                  </button>
                </td>
              );
            })}
            {rowTotals && (
              <td className="pl-2 text-sm font-semibold" aria-label={`Row ${String(r + 1)} total`}>
                {rowTotals[r]}
              </td>
            )}
          </tr>
        ))}
        {colTotals && (
          <tr>
            {colTotals.map((total, c) => (
              <td key={c} className="pt-1 text-sm font-semibold" aria-label={`Column ${String(c + 1)} total`}>
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
    <p className="text-base leading-relaxed">
      {words.map((word, i) => (
        <span key={word.id}>
          <button
            type="button"
            onClick={() => onSelect?.(word.id)}
            disabled={!onSelect}
            style={unitStyle(word.state, undefined)}
            className="rounded px-0.5 disabled:cursor-default"
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
    <div className="flex items-center gap-2 text-sm" aria-label={`${label}: ${String(used)} of ${String(total)} used`}>
      <span className="font-medium">{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full border border-[var(--border)]"
            style={{ background: i < used ? "var(--text)" : "transparent" }}
          />
        ))}
      </span>
    </div>
  );
}

function Actions({ actions }: ActionsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.variant === "secondary"
              ? "rounded-full border-2 border-[var(--border)] px-4 py-1.5 text-sm font-semibold disabled:opacity-40"
              : "rounded-full bg-[var(--text)] px-4 py-1.5 text-sm font-semibold text-[var(--bg)] disabled:opacity-40"
          }
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
  const color = tone === "error" ? "#b91c1c" : tone === "success" ? "#15803d" : "var(--text)";
  return (
    <p role="status" aria-live="polite" className="text-sm font-medium" style={{ color }}>
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  return (
    <ul className="flex flex-col gap-1 text-sm" aria-label="History">
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
        aria-labelledby="play-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border-2 border-[var(--border)] bg-[var(--bg)] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="play-modal-title" className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none">
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
        className="w-full"
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
            <th key={col.id} className="px-1 pb-1 font-medium">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rowLabels.map((row) => (
          <tr key={row.id}>
            <th scope="row" className="pr-2 text-right font-medium">
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
                    className="flex h-8 w-8 items-center justify-center rounded border-2 border-[var(--border)] font-bold disabled:cursor-default"
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
      <main className="mx-auto max-w-[560px] px-4 py-6">
        <h1 className="text-lg font-bold tracking-tight">
          <button type="button" onClick={onExit} className="underline-offset-4 hover:underline">
            Board at Work
          </button>
        </h1>
        <p className="mt-4 text-sm text-neutral-500">Loading…</p>
      </main>
    </div>
  );
}

export const playSkin: SkinPrimitives = {
  id: "play",
  displayName: "Play",
  favicon: "🎮",
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
