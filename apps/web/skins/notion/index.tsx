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
 * Notion skin (SPEC §3.1): a wiki-page disguise — a decorative breadcrumb
 * trail, a big emoji page icon above the title, and callout-block styled
 * containers (rounded box, left accent bar, leading icon) around every
 * content section, the way a Notion page nests toggle/callout blocks under
 * its title. Grid renders as a clean-lined "database" table view; Log reads
 * like a comment thread left on the page.
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#f7f6f3",
  ["--accent-a" as string]: "#fdecc8",
  ["--accent-b" as string]: "#dbeddb",
  ["--accent-c" as string]: "#d3e5ef",
  ["--text" as string]: "#37352f",
  ["--bg" as string]: "#ffffff",
  ["--border" as string]: "#e9e9e7",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

function unitStyle(state: UnitState | undefined, token: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: token ? `var(${token})` : "var(--tile-bg)",
    color: "var(--text)",
    border: "1px solid var(--border)",
  };
  if (state === "wrong") {
    base.textDecoration = "line-through";
    base.borderColor = "#e03e3e";
    base.background = "#fbe4e4";
  } else if (state === "correct") {
    base.fontWeight = 700;
    base.borderColor = "#2f9e44";
    base.boxShadow = "inset 0 0 0 1px #2f9e44";
  } else if (state === "locked") {
    base.fontWeight = 700;
    base.borderStyle = "dashed";
  } else if (state === "selected") {
    base.outline = "2px solid var(--text)";
    base.outlineOffset = "1px";
  }
  return base;
}

/** Notion-style callout block: rounded box, left accent bar, leading icon. */
function Callout({
  icon,
  accent,
  children,
}: {
  icon: string;
  accent: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className="flex gap-3 rounded-md border border-[var(--border)] bg-[var(--tile-bg)] p-3"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <span aria-hidden="true" className="text-lg leading-6">
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-[760px] px-10 py-12">
        <nav aria-hidden="true" className="mb-3 flex items-center gap-1 text-xs text-neutral-500">
          <span>Workspace</span>
          <span>/</span>
          <span>Puzzles</span>
          <span>/</span>
          <span className="text-neutral-700">{title}</span>
        </nav>
        <div aria-hidden="true" className="mb-2 text-5xl leading-none">
          🧩
        </div>
        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          {onTitleClick ? (
            <button
              type="button"
              onClick={onTitleClick}
              className="rounded px-1 -mx-1 hover:bg-[var(--tile-bg)] focus-visible:bg-[var(--tile-bg)]"
            >
              {title}
            </button>
          ) : (
            title
          )}
        </h1>
        <main className="flex flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}

function TextRun({ items, groupTokens, onSelect }: TextRunProps): React.ReactElement {
  return (
    <Callout icon="🔤" accent="var(--accent-a)">
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
            className="flex h-9 w-9 items-center justify-center rounded text-base font-semibold uppercase disabled:cursor-default"
          >
            {item.text}
          </button>
        ))}
      </div>
    </Callout>
  );
}

function TileRow({ rows, groupTokens, onSelect }: TileRowProps): React.ReactElement {
  return (
    <Callout icon="📋" accent="var(--accent-b)">
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            {row.label !== undefined && (
              <span className="w-20 shrink-0 text-sm font-medium text-neutral-600">{row.label}</span>
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
                  className="flex h-8 w-8 items-center justify-center rounded text-sm font-semibold uppercase disabled:cursor-default"
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Callout>
  );
}

function Slots({ slots, onSelect }: SlotsProps): React.ReactElement {
  return (
    <Callout icon="⬜" accent="var(--accent-c)">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Answer slots">
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            onClick={() => onSelect?.(slot.id)}
            aria-label={slot.value ?? slot.placeholder ?? "Empty slot"}
            disabled={!onSelect}
            style={unitStyle(slot.state, undefined)}
            className="flex h-9 w-9 items-center justify-center rounded text-base font-semibold disabled:cursor-default"
          >
            {slot.value ?? ""}
          </button>
        ))}
      </div>
    </Callout>
  );
}

function Grid({ rows, cols, cells, rowTotals, colTotals, onSelect }: GridProps): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--border)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--tile-bg)]">
            <th scope="col" className="sr-only">
              Row
            </th>
            {Array.from({ length: cols }, (_, c) => (
              <th key={c} scope="col" className="px-2 py-1.5 text-left text-xs font-medium text-neutral-500">
                Column {c + 1}
              </th>
            ))}
            {rowTotals && (
              <th scope="col" className="px-2 py-1.5 text-left text-xs font-medium text-neutral-500">
                Total
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r} className="border-b border-[var(--border)] last:border-0">
              <th scope="row" className="sr-only">
                Row {r + 1}
              </th>
              {Array.from({ length: cols }, (_, c) => {
                const cell = cells[r * cols + c];
                if (!cell) return <td key={c} className="p-1" />;
                return (
                  <td key={cell.id} className="p-1">
                    <button
                      type="button"
                      onClick={() => onSelect?.(cell.id)}
                      disabled={!onSelect}
                      aria-label={`Row ${String(r + 1)}, column ${String(c + 1)}: ${cell.value}`}
                      style={unitStyle(cell.state, undefined)}
                      className="flex h-9 w-9 items-center justify-center rounded text-sm font-medium disabled:cursor-default"
                    >
                      {cell.value}
                    </button>
                  </td>
                );
              })}
              {rowTotals && (
                <td className="px-2 text-sm font-semibold text-neutral-600" aria-label={`Row ${String(r + 1)} total`}>
                  {rowTotals[r]}
                </td>
              )}
            </tr>
          ))}
          {colTotals && (
            <tr>
              <th scope="row" className="px-2 py-1 text-left text-xs font-medium text-neutral-500">
                Total
              </th>
              {colTotals.map((total, c) => (
                <td key={c} className="px-2 py-1 text-sm font-semibold text-neutral-600" aria-label={`Column ${String(c + 1)} total`}>
                  {total}
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
    <Callout icon="📖" accent="var(--accent-a)">
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
    </Callout>
  );
}

function Passes({ label, used, total }: PassesProps): React.ReactElement {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      aria-label={`${label}: ${String(used)} of ${String(total)} used`}
    >
      <span className="font-medium text-neutral-600">{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full border border-[var(--border)]"
            style={{ background: i < used ? "var(--text)" : "transparent" }}
          />
        ))}
      </span>
      <span className="text-xs text-neutral-500" aria-hidden="true">
        {used}/{total}
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
              ? "rounded border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--tile-bg)] disabled:opacity-40"
              : "rounded bg-[var(--text)] px-3 py-1.5 text-sm font-medium text-[var(--bg)] hover:opacity-90 disabled:opacity-40"
          }
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
  const accent = tone === "error" ? "#e03e3e" : tone === "success" ? "#2f9e44" : "#9b9a97";
  const prefix = tone === "error" ? "⚠ " : tone === "success" ? "✓ " : "";
  return (
    <p
      role="status"
      aria-live="polite"
      className="rounded-md border border-[var(--border)] bg-[var(--tile-bg)] px-3 py-2 text-sm font-medium"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {prefix}
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  return (
    <Callout icon="💬" accent="var(--accent-c)">
      <ul className="flex flex-col gap-2" aria-label="Comments">
        {entries.map((entry) => {
          const author = entry.author ?? "Reviewer";
          return (
            <li key={entry.id} className="flex gap-2 text-sm">
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--text)] text-[10px] font-semibold text-[var(--bg)]"
              >
                {author.charAt(0).toUpperCase()}
              </span>
              <span>
                <strong className="font-semibold">{author}</strong>
                <span className="ml-1 text-neutral-700">{entry.text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Callout>
  );
}

function Modal({ open, title, onClose, children }: ModalProps): React.ReactElement | null {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notion-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="notion-modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 text-xl leading-none hover:bg-[var(--tile-bg)]"
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
        className="w-full accent-[var(--text)]"
      />
    </label>
  );
}

function LogicGrid({ rowLabels, colLabels, cells, onSelect }: LogicGridProps): React.ReactElement {
  const cellFor = (rowId: string, colId: string) =>
    cells.find((cell) => cell.rowId === rowId && cell.colId === colId);
  return (
    <Callout icon="⚙️" accent="var(--accent-b)">
      <table className="border-collapse text-center text-sm">
        <thead>
          <tr>
            <th className="sr-only">Row / column</th>
            {colLabels.map((col) => (
              <th key={col.id} className="border border-[var(--border)] px-1 pb-1 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="border border-[var(--border)] pr-2 text-right font-medium">
                {row.label}
              </th>
              {colLabels.map((col) => {
                const cell = cellFor(row.id, col.id);
                const glyph = cell?.state === "yes" ? "✓" : cell?.state === "no" ? "✗" : "";
                return (
                  <td key={col.id} className="border border-[var(--border)] p-0.5">
                    <button
                      type="button"
                      onClick={() => onSelect?.(row.id, col.id)}
                      disabled={!onSelect}
                      aria-label={`${row.label}, ${col.label}: ${cell?.state ?? "empty"}`}
                      className="flex h-8 w-8 items-center justify-center rounded bg-[var(--bg)] font-bold disabled:cursor-default"
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
    </Callout>
  );
}

function Cover({ onExit }: { onExit: () => void }): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="mx-auto max-w-[760px] px-10 py-12">
        <nav aria-hidden="true" className="mb-3 flex items-center gap-1 text-xs text-neutral-500">
          <span>Workspace</span>
          <span>/</span>
          <span className="text-neutral-700">Untitled</span>
        </nav>
        <div aria-hidden="true" className="mb-2 text-5xl leading-none text-neutral-300">
          📄
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-neutral-400">
          <button
            type="button"
            onClick={onExit}
            className="rounded px-1 -mx-1 hover:bg-[var(--tile-bg)] focus-visible:bg-[var(--tile-bg)]"
          >
            Untitled
          </button>
        </h1>
        <p aria-hidden="true" className="mb-8 flex gap-3 text-sm text-neutral-400">
          <span>Add icon</span>
          <span>Add cover</span>
          <span>Add comment</span>
        </p>
        <p className="text-sm text-neutral-400">Press &lsquo;/&rsquo; for commands</p>
      </main>
    </div>
  );
}

export const notionSkin: SkinPrimitives = {
  id: "notion",
  displayName: "Notion",
  favicon: "📝",
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
