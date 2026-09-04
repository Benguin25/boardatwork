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
 * Jira skin (SPEC §3.1): an issue-tracker disguise — a top nav bar and a
 * kanban-style board of small "ticket" cards. Every primitive maps onto
 * that idiom (rows become columns of issue cards, letters become compact
 * ticket chips, feedback/log become an "activity on this epic" thread) but
 * stays fully generic: no game-specific labels or content live here.
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#ffffff",
  ["--accent-a" as string]: "#0052cc",
  ["--accent-b" as string]: "#00875a",
  ["--accent-c" as string]: "#ff8b00",
  ["--text" as string]: "#172b4d",
  ["--bg" as string]: "#f4f5f7",
  ["--border" as string]: "#dfe1e6",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

/**
 * Shared "ticket" chrome for a single addressable unit. Color alone never
 * signals state: `wrong` also strikes the text, `correct` also adds a
 * check glyph, `locked` also adds a lock glyph and a heavier border, and
 * `selected` also adds a visible ring plus bold weight.
 */
function unitClasses(state: UnitState | undefined): string {
  const base = "border rounded-[3px]";
  switch (state) {
    case "wrong":
      return `${base} border-[#de350b] line-through`;
    case "correct":
      return `${base} border-[#00875a] font-bold`;
    case "locked":
      return `${base} border-[var(--text)] border-2 font-bold`;
    case "selected":
      return `${base} border-[#0052cc] font-bold ring-2 ring-[#0052cc] ring-offset-1`;
    default:
      return `${base} border-[var(--border)]`;
  }
}

function unitGlyph(state: UnitState | undefined): string {
  if (state === "correct") return "✓ ";
  if (state === "locked") return "🔒 ";
  if (state === "wrong") return "✗ ";
  return "";
}

function tokenStyle(token: string | undefined): React.CSSProperties {
  return token ? { borderLeftColor: `var(${token})`, borderLeftWidth: "4px" } : {};
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[#0052cc] text-white">
        <div className="mx-auto flex max-w-[860px] items-center gap-3 px-4 py-2.5">
          <span className="rounded bg-white/15 px-2 py-1 text-xs font-bold tracking-wide" aria-hidden="true">
            JIRA
          </span>
          <h1 className="text-sm font-semibold">
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className="rounded underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                {title}
              </button>
            ) : (
              title
            )}
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-[860px] px-4 py-6">{children}</main>
    </div>
  );
}

function TextRun({ items, groupTokens, onSelect }: TextRunProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Issue chips">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          aria-label={item.ariaLabel ?? item.text}
          aria-pressed={item.state === "selected"}
          disabled={!onSelect}
          style={{
            background: "var(--tile-bg)",
            color: "var(--text)",
            ...tokenStyle(item.groupId ? groupTokens?.[item.groupId] : undefined),
          }}
          className={`${unitClasses(item.state)} flex h-9 min-w-9 items-center justify-center px-1.5 text-sm font-medium uppercase shadow-sm disabled:cursor-default disabled:opacity-90`}
        >
          {unitGlyph(item.state)}
          {item.text}
        </button>
      ))}
    </div>
  );
}

function TileRow({ rows, groupTokens, onSelect }: TileRowProps): React.ReactElement {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Board columns">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex w-48 shrink-0 flex-col gap-2 rounded bg-[#ebecf0] p-2"
        >
          {row.label !== undefined && (
            <div className="px-1 text-xs font-bold uppercase tracking-wide text-[#44546f]">
              {row.label}
              <span className="ml-1 font-normal">({row.items.length})</span>
            </div>
          )}
          <ul className="flex flex-col gap-1.5" aria-label={row.label ?? "Column"}>
            {row.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(row.id, item.id)}
                  aria-label={item.ariaLabel ?? item.text}
                  disabled={!onSelect}
                  style={{
                    background: "var(--tile-bg)",
                    color: "var(--text)",
                    ...tokenStyle(item.groupId ? groupTokens?.[item.groupId] : undefined),
                  }}
                  className={`${unitClasses(item.state)} flex w-full items-center gap-1 px-2 py-1.5 text-left text-sm font-medium shadow-sm disabled:cursor-default disabled:opacity-90`}
                >
                  {unitGlyph(item.state)}
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Slots({ slots, onSelect }: SlotsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ticket fields">
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          onClick={() => onSelect?.(slot.id)}
          aria-label={slot.value ?? slot.placeholder ?? "Empty field"}
          disabled={!onSelect}
          style={{ background: "var(--tile-bg)", color: "var(--text)" }}
          className={`${unitClasses(slot.state)} flex h-9 min-w-9 items-center justify-center px-2 text-sm font-medium shadow-sm disabled:cursor-default disabled:opacity-90`}
        >
          {unitGlyph(slot.state)}
          {slot.value ?? <span className="text-[#5a6472]">{slot.placeholder ?? "—"}</span>}
        </button>
      ))}
    </div>
  );
}

function Grid({ rows, cols, cells, rowTotals, colTotals, onSelect }: GridProps): React.ReactElement {
  return (
    <table className="border-collapse text-center text-sm">
      <caption className="sr-only">Story point grid</caption>
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
                    style={{ background: "var(--tile-bg)", color: "var(--text)" }}
                    className={`${unitClasses(cell.state)} flex h-9 w-9 items-center justify-center text-xs font-semibold shadow-sm disabled:cursor-default disabled:opacity-90`}
                  >
                    {cell.value}
                  </button>
                </td>
              );
            })}
            {rowTotals && (
              <td className="pl-2 text-xs font-bold text-[#44546f]" aria-label={`Row ${String(r + 1)} total`}>
                {rowTotals[r]}
              </td>
            )}
          </tr>
        ))}
        {colTotals && (
          <tr>
            {colTotals.map((total, c) => (
              <td key={c} className="pt-1 text-xs font-bold text-[#44546f]" aria-label={`Column ${String(c + 1)} total`}>
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
    <p className="rounded border border-[var(--border)] bg-[var(--tile-bg)] p-3 text-sm leading-relaxed shadow-sm">
      {words.map((word, i) => (
        <span key={word.id}>
          <button
            type="button"
            onClick={() => onSelect?.(word.id)}
            disabled={!onSelect}
            className={`${unitClasses(word.state)} px-0.5 disabled:cursor-default`}
          >
            {unitGlyph(word.state)}
            {word.text}
          </button>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </p>
  );
}

function Passes({ label, used, total }: PassesProps): React.ReactElement {
  const remaining = total - used;
  return (
    <div
      className="flex items-center gap-2 text-sm"
      aria-label={`${label}: ${String(used)} of ${String(total)} used`}
    >
      <span className="font-semibold text-[#44546f]">{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-sm border border-[#0052cc]"
            style={{ background: i < used ? "#0052cc" : "transparent" }}
          />
        ))}
      </span>
      <span className="text-xs text-[#44546f]">{remaining} left</span>
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
              ? "rounded border border-[#0052cc] bg-white px-3 py-1.5 text-sm font-semibold text-[#0052cc] shadow-sm disabled:opacity-40"
              : "rounded bg-[#0052cc] px-3 py-1.5 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
          }
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
  const toneClasses =
    tone === "error"
      ? "border-[#de350b] bg-[#ffebe6] text-[#bf2600] font-semibold"
      : tone === "success"
        ? "border-[#00875a] bg-[#e3fcef] text-[#006644] font-semibold"
        : "border-[var(--border)] bg-white text-[var(--text)]";
  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded border px-3 py-2 text-sm ${toneClasses}`}
    >
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  return (
    <div className="rounded border border-[var(--border)] bg-white shadow-sm">
      <div className="border-b border-[var(--border)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#44546f]">
        Activity on this epic
      </div>
      <ul className="flex flex-col divide-y divide-[var(--border)] text-sm" aria-label="Comment history">
        {entries.map((entry) => (
          <li key={entry.id} className="px-3 py-2">
            <span className="font-semibold">{entry.author ?? "System"}</span>
            <span className="text-[#44546f]"> commented: </span>
            {entry.text}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="jira-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded bg-white p-5 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-2">
          <h2 id="jira-modal-title" className="text-base font-bold text-[var(--text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-1.5 text-lg leading-none text-[#44546f] hover:bg-[#ebecf0]"
          >
            ×
          </button>
        </div>
        <div className="text-[var(--text)]">{children}</div>
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, unit, onChange }: SliderProps): React.ReactElement {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-[var(--text)]">
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
        className="w-full accent-[#0052cc]"
      />
    </label>
  );
}

function LogicGrid({ rowLabels, colLabels, cells, onSelect }: LogicGridProps): React.ReactElement {
  const cellFor = (rowId: string, colId: string) =>
    cells.find((cell) => cell.rowId === rowId && cell.colId === colId);
  return (
    <table className="border-collapse text-center text-sm">
      <caption className="sr-only">Issue link matrix</caption>
      <thead>
        <tr>
          <th className="sr-only">Row / column</th>
          {colLabels.map((col) => (
            <th key={col.id} className="px-1 pb-1 font-semibold text-[#44546f]">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rowLabels.map((row) => (
          <tr key={row.id}>
            <th scope="row" className="pr-2 text-right font-semibold text-[#44546f]">
              {row.label}
            </th>
            {colLabels.map((col) => {
              const cell = cellFor(row.id, col.id);
              const glyph = cell?.state === "yes" ? "✓" : cell?.state === "no" ? "✗" : "";
              const linked = cell?.state === "yes";
              return (
                <td key={col.id} className="p-0.5">
                  <button
                    type="button"
                    onClick={() => onSelect?.(row.id, col.id)}
                    disabled={!onSelect}
                    aria-label={`${row.label}, ${col.label}: ${cell?.state ?? "empty"}`}
                    className={`flex h-8 w-8 items-center justify-center rounded border-2 font-bold shadow-sm disabled:cursor-default ${
                      linked ? "border-[#00875a] bg-[#e3fcef]" : "border-[var(--border)] bg-white"
                    } ${cell?.state === "no" ? "border-[#de350b] bg-[#ffebe6]" : ""}`}
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
      <header className="border-b border-[var(--border)] bg-[#0052cc] text-white">
        <div className="mx-auto flex max-w-[860px] items-center gap-3 px-4 py-2.5">
          <span className="rounded bg-white/15 px-2 py-1 text-xs font-bold tracking-wide" aria-hidden="true">
            JIRA
          </span>
          <h1 className="text-sm font-semibold">
            <button
              type="button"
              onClick={onExit}
              className="rounded underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Board at Work
            </button>
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-[860px] px-4 py-10">
        <p className="text-sm text-[#44546f]">No issues match your filter.</p>
        <p className="mt-1 text-xs text-[#5a6472]">Try adjusting your search or filters to find what you&rsquo;re looking for.</p>
      </main>
    </div>
  );
}

export const jiraSkin: SkinPrimitives = {
  id: "jira",
  displayName: "Jira",
  favicon: "🗂️",
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
