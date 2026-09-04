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
 * Slack skin: a chat-app disguise. The puzzle body renders as a message in
 * a fake channel, feedback and history arrive as threaded replies, and a
 * decorative (non-interactive) channel sidebar sells the idiom. Behaviour
 * mirrors the Play skin exactly (SPEC §3.1) — only the visual language and
 * DOM shape differ.
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#f8f8f8",
  ["--accent-a" as string]: "#fde68a",
  ["--accent-b" as string]: "#bbf7d0",
  ["--accent-c" as string]: "#bfdbfe",
  ["--text" as string]: "#1d1c1d",
  ["--bg" as string]: "#ffffff",
  ["--border" as string]: "#dcd8dc",
  ["--rail" as string]: "#3f0e40",
  ["--rail-text" as string]: "#f4ede4",
  ["--rail-active" as string]: "#521752",
  fontFamily:
    'Slack-Lato, "Helvetica Neue", ui-sans-serif, system-ui, -apple-system, sans-serif',
};

const CHANNELS = ["#general", "#design-review", "#random", "#watercooler"];

function unitStyle(state: UnitState | undefined, token: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: token ? `var(${token})` : "var(--tile-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };
  if (state === "wrong") {
    base.background = "#fecaca";
    base.textDecoration = "line-through";
    base.borderColor = "#b91c1c";
  } else if (state === "correct") {
    base.fontWeight = 700;
    base.borderColor = "#15803d";
  } else if (state === "locked") {
    base.fontWeight = 700;
    base.borderStyle = "dashed";
  } else if (state === "selected") {
    base.outline = "2px solid #1264a3";
    base.outlineOffset = "1px";
  }
  return base;
}

function Sidebar(): React.ReactElement {
  return (
    <nav
      aria-label="Channels"
      className="hidden w-48 shrink-0 flex-col gap-1 bg-[var(--rail)] px-2 py-4 text-[var(--rail-text)] sm:flex"
    >
      <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide opacity-70">Channels</p>
      <ul className="flex flex-col gap-0.5">
        {CHANNELS.map((name, i) => (
          <li key={name}>
            <span
              className={
                "block truncate rounded px-2 py-1 text-sm " +
                (i === 0 ? "bg-[var(--rail-active)] font-semibold" : "opacity-80")
              }
            >
              {name}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--border)] px-4 py-3 shadow-sm">
          <h1 className="text-base font-bold">
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className="rounded underline-offset-4 hover:underline"
              >
                # {title}
              </button>
            ) : (
              <>#{" "}{title}</>
            )}
          </h1>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      </div>
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
          className="flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold uppercase disabled:cursor-default"
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
        <div key={row.id} className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-2">
          {row.label !== undefined && (
            <p className="mb-1 text-xs font-semibold text-neutral-500">{row.label}</p>
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
                className="flex h-8 items-center justify-center rounded-full px-2 text-sm font-semibold uppercase disabled:cursor-default"
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
          className="flex h-9 w-9 items-center justify-center rounded text-base font-semibold disabled:cursor-default"
        >
          {slot.value ?? ""}
        </button>
      ))}
    </div>
  );
}

function MessageBubble({
  author,
  children,
}: {
  author: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex gap-3">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-c)] text-sm font-bold"
      >
        {author.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">
          {author} <span className="ml-1 font-normal text-neutral-400">now</span>
        </p>
        <div className="mt-0.5 text-sm">{children}</div>
      </div>
    </div>
  );
}

function Grid({ rows, cols, cells, rowTotals, colTotals, onSelect }: GridProps): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded border border-[var(--border)] bg-[var(--tile-bg)] p-2 font-mono">
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
                      className="flex h-9 w-9 items-center justify-center rounded text-sm font-medium disabled:cursor-default"
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
    </div>
  );
}

function Passage({ words, onSelect }: PassageProps): React.ReactElement {
  return (
    <p className="rounded border border-[var(--border)] bg-[var(--tile-bg)] p-3 text-sm leading-relaxed">
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
    <div
      className="flex items-center gap-2 text-xs font-medium text-neutral-600"
      aria-label={`${label}: ${String(used)} of ${String(total)} used`}
    >
      <span>{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full border border-[var(--border)]"
            style={{ background: i < used ? "#611f69" : "transparent" }}
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
              ? "rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--tile-bg)] disabled:opacity-40"
              : "rounded bg-[#611f69] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
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
    <p
      role="status"
      aria-live="polite"
      className="rounded border-l-4 bg-[var(--tile-bg)] px-3 py-2 text-sm font-medium"
      style={{ color, borderLeftColor: color }}
    >
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  if (entries.length === 0) {
    return (
      <p className="border-l-2 border-[var(--border)] pl-4 text-xs text-neutral-400">
        No replies yet
      </p>
    );
  }
  return (
    <ul
      className="flex flex-col gap-3 border-l-2 border-[var(--border)] pl-4"
      aria-label="Thread replies"
    >
      {entries.map((entry) => (
        <li key={entry.id}>
          <MessageBubble author={entry.author ?? "Thread"}>{entry.text}</MessageBubble>
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
        aria-labelledby="slack-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 id="slack-modal-title" className="text-base font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-1 text-xl leading-none hover:bg-[var(--tile-bg)]"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, unit, onChange }: SliderProps): React.ReactElement {
  return (
    <label className="flex flex-col gap-1 rounded border border-[var(--border)] bg-[var(--tile-bg)] p-3 text-sm font-medium">
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
        className="w-full accent-[#611f69]"
      />
    </label>
  );
}

function LogicGrid({ rowLabels, colLabels, cells, onSelect }: LogicGridProps): React.ReactElement {
  const cellFor = (rowId: string, colId: string) =>
    cells.find((cell) => cell.rowId === rowId && cell.colId === colId);
  return (
    <div className="overflow-x-auto rounded border border-[var(--border)] bg-[var(--tile-bg)] p-2 font-mono">
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
                      className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border)] bg-[var(--bg)] font-bold disabled:cursor-default"
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
  return (
    <div style={ROOT_STYLE} className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--border)] px-4 py-3 shadow-sm">
          <h1 className="text-base font-bold">
            <button
              type="button"
              onClick={onExit}
              className="rounded underline-offset-4 hover:underline"
            >
              # general
            </button>
          </h1>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          <p className="text-sm text-neutral-400">You&apos;re all caught up.</p>
        </main>
      </div>
    </div>
  );
}

export const slackSkin: SkinPrimitives = {
  id: "slack",
  displayName: "Slack",
  favicon: "💬",
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
