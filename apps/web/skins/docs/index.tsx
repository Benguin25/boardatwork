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
 * Docs skin (SPEC §3.1): a document-editor disguise — a grey title bar with
 * a doc icon and static File/Edit/View labels, a grey toolbar strip, and a
 * white 8.5"-proportioned page centred on a grey canvas. Addressable units
 * read like Docs' yellow comment-highlight; the log reads like a right-
 * margin comment thread from a fictional "Reviewer".
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#fef7e0",
  ["--accent-a" as string]: "#fbbc04",
  ["--accent-b" as string]: "#34a853",
  // #4285f4 (Google blue 500) only reaches a 3.56:1 contrast ratio against
  // white text, short of WCAG AA's 4.5:1 for the primary Actions button and
  // Log avatar circle (both render white text on this token) — darkened to
  // #1967d2 (5.37:1) to fix that (CLAUDE.md: "Accessibility is not
  // optional"), without changing the Google-blue identity of the token.
  ["--accent-c" as string]: "#1967d2",
  ["--text" as string]: "#202124",
  ["--bg" as string]: "#ffffff",
  ["--border" as string]: "#dadce0",
  ["--canvas" as string]: "#f0f1f3",
  fontFamily:
    '"Google Sans", "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif',
};

function unitStyle(state: UnitState | undefined, token: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: token ? `var(${token})` : "var(--tile-bg)",
    color: "var(--text)",
    borderBottom: "2px solid transparent",
  };
  if (state === "wrong") {
    base.textDecoration = "line-through wavy";
    base.borderBottomColor = "#c5221f";
    base.background = "#fce8e6";
  } else if (state === "correct") {
    base.fontWeight = 700;
    base.borderBottomColor = "var(--accent-b)";
  } else if (state === "locked") {
    base.fontWeight = 700;
    base.borderBottom = "2px double var(--text)";
  } else if (state === "selected") {
    base.outline = "2px solid var(--accent-c)";
    base.outlineOffset = "1px";
  }
  return base;
}

function DocPage({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <main className="min-h-[calc(100vh-6.5rem)] bg-[var(--canvas)] px-4 py-8">
      <div className="mx-auto max-w-[680px] rounded-sm border border-[var(--border)] bg-[var(--bg)] px-10 py-10 shadow-sm">
        {children}
      </div>
    </main>
  );
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[860px] items-center gap-3 px-4 pt-3">
          <span aria-hidden="true" className="text-2xl">
            📄
          </span>
          <div className="flex flex-col">
            <h1 className="text-lg font-normal leading-tight tracking-tight">
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
            <div aria-hidden="true" className="flex gap-3 pb-2 text-xs text-neutral-500">
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
              <span>Insert</span>
              <span>Format</span>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border)] bg-[#f8f9fa] px-4 py-1.5">
          <div className="mx-auto flex max-w-[860px] items-center gap-2 text-xs text-neutral-500" aria-hidden="true">
            <span className="rounded border border-[var(--border)] px-2 py-0.5">100%</span>
            <span className="rounded border border-[var(--border)] px-2 py-0.5">B</span>
            <span className="rounded border border-[var(--border)] px-2 py-0.5 italic">I</span>
            <span className="rounded border border-[var(--border)] px-2 py-0.5 underline">U</span>
          </div>
        </div>
      </header>
      <DocPage>{children}</DocPage>
    </div>
  );
}

function TextRun({ items, groupTokens, onSelect }: TextRunProps): React.ReactElement {
  return (
    <span className="inline-flex flex-wrap gap-0.5" role="group" aria-label="Letters">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          aria-label={item.ariaLabel ?? item.text}
          aria-pressed={item.state === "selected"}
          disabled={!onSelect}
          style={unitStyle(item.state, item.groupId ? groupTokens?.[item.groupId] : undefined)}
          className="flex h-9 w-9 items-center justify-center rounded-sm text-base font-medium uppercase disabled:cursor-default"
        >
          {item.text}
        </button>
      ))}
    </span>
  );
}

function TileRow({ rows, groupTokens, onSelect }: TileRowProps): React.ReactElement {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-2 marker:text-neutral-400 list-disc list-inside">
          {row.label !== undefined && (
            <span className="w-24 shrink-0 text-sm font-medium text-neutral-600">{row.label}</span>
          )}
          <span className="flex flex-wrap gap-1" role="group" aria-label={row.label ?? "Row"}>
            {row.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect?.(row.id, item.id)}
                aria-label={item.ariaLabel ?? item.text}
                disabled={!onSelect}
                style={unitStyle(item.state, item.groupId ? groupTokens?.[item.groupId] : undefined)}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-sm font-medium uppercase disabled:cursor-default"
              >
                {item.text}
              </button>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Slots({ slots, onSelect }: SlotsProps): React.ReactElement {
  return (
    <span className="inline-flex flex-wrap gap-1" role="group" aria-label="Answer slots">
      {slots.map((slot) => {
        const style = unitStyle(slot.state, undefined);
        if (!slot.state) {
          style.borderBottom = "2px solid var(--border)";
        }
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onSelect?.(slot.id)}
            aria-label={slot.value ?? slot.placeholder ?? "Empty slot"}
            disabled={!onSelect}
            style={style}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-base font-medium disabled:cursor-default"
          >
            {slot.value ?? ""}
          </button>
        );
      })}
    </span>
  );
}

function Grid({ rows, cols, cells, rowTotals, colTotals, onSelect }: GridProps): React.ReactElement {
  return (
    <table className="border-collapse text-center text-sm">
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => {
              const cell = cells[r * cols + c];
              if (!cell) return <td key={c} className="border border-[var(--border)]" />;
              return (
                <td key={cell.id} className="border border-[var(--border)] p-0.5">
                  <button
                    type="button"
                    onClick={() => onSelect?.(cell.id)}
                    disabled={!onSelect}
                    aria-label={`Row ${String(r + 1)}, column ${String(c + 1)}: ${cell.value}`}
                    style={unitStyle(cell.state, undefined)}
                    className="flex h-9 w-9 items-center justify-center rounded-sm font-medium disabled:cursor-default"
                  >
                    {cell.value}
                  </button>
                </td>
              );
            })}
            {rowTotals && (
              <td className="border-none pl-2 text-sm font-semibold" aria-label={`Row ${String(r + 1)} total`}>
                {rowTotals[r]}
              </td>
            )}
          </tr>
        ))}
        {colTotals && (
          <tr>
            {colTotals.map((total, c) => (
              <td key={c} className="border-none pt-1 text-sm font-semibold" aria-label={`Column ${String(c + 1)} total`}>
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
    <p className="text-base leading-loose">
      {words.map((word, i) => (
        <span key={word.id}>
          <button
            type="button"
            onClick={() => onSelect?.(word.id)}
            disabled={!onSelect}
            style={unitStyle(word.state, undefined)}
            className="rounded-sm px-0.5 disabled:cursor-default"
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
      <span className="font-medium text-neutral-600">{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full border border-[var(--border)]"
            style={{ background: i < used ? "var(--accent-c)" : "transparent" }}
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
    <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.variant === "secondary"
              ? "rounded border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--tile-bg)] disabled:opacity-40"
              : "rounded bg-[var(--accent-c)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          }
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
  const color = tone === "error" ? "#c5221f" : tone === "success" ? "#188038" : "var(--text)";
  const prefix = tone === "error" ? "⚠ " : tone === "success" ? "✓ " : "";
  return (
    <p role="status" aria-live="polite" className="text-sm font-medium" style={{ color }}>
      {prefix}
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  return (
    <ul className="flex flex-col gap-2" aria-label="Comments">
      {entries.map((entry) => {
        const author = entry.author ?? "Reviewer";
        return (
          <li
            key={entry.id}
            className="flex gap-2 rounded border border-[var(--border)] bg-[#f8f9fa] p-2 text-sm"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-c)] text-xs font-semibold text-white"
            >
              {author.charAt(0).toUpperCase()}
            </span>
            <span>
              <strong className="font-semibold">{author}</strong>
              <span className="block text-neutral-700">{entry.text}</span>
            </span>
          </li>
        );
      })}
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
        aria-labelledby="docs-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="docs-modal-title" className="text-lg font-medium">
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
                    className="flex h-8 w-8 items-center justify-center rounded-sm font-bold disabled:cursor-default"
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
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[860px] items-center gap-3 px-4 pt-3">
          <span aria-hidden="true" className="text-2xl">
            📄
          </span>
          <div className="flex flex-col">
            <h1 className="text-lg font-normal leading-tight tracking-tight">
              <button
                type="button"
                onClick={onExit}
                className="rounded px-1 -mx-1 hover:bg-[var(--tile-bg)] focus-visible:bg-[var(--tile-bg)]"
              >
                Untitled document
              </button>
            </h1>
            <div aria-hidden="true" className="flex gap-3 pb-2 text-xs text-neutral-500">
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
              <span>Insert</span>
              <span>Format</span>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border)] bg-[#f8f9fa] px-4 py-1.5" aria-hidden="true" />
      </header>
      <DocPage>
        <p className="text-sm text-neutral-500">Meeting notes</p>
        <p className="mt-4 text-sm text-neutral-400">No content yet. Start typing to take notes.</p>
      </DocPage>
    </div>
  );
}

export const docsSkin: SkinPrimitives = {
  id: "docs",
  displayName: "Docs",
  favicon: "📄",
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
