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
 * Outlook skin: a three-pane inbox disguise — folder list, message list,
 * and a reading pane where the puzzle content sits as the body of an
 * open email. Visual language is deliberately email-client-flavoured
 * (ribbon toolbar, threaded replies, folder tree) rather than game-like,
 * while every primitive stays fully generic and data-driven.
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#eef3fb",
  ["--accent-a" as string]: "#ffd966",
  ["--accent-b" as string]: "#8fd19e",
  ["--accent-c" as string]: "#8ec6f0",
  ["--text" as string]: "#1f2430",
  ["--bg" as string]: "#ffffff",
  ["--border" as string]: "#c7cdd9",
  ["--panel" as string]: "#f3f5f9",
  ["--brand" as string]: "#0a5cd8",
  fontFamily:
    '"Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif',
};

const FOLDERS: readonly { id: string; label: string; count?: number }[] = [
  { id: "inbox", label: "Inbox", count: 12 },
  { id: "sent", label: "Sent Items" },
  { id: "drafts", label: "Drafts", count: 2 },
  { id: "archive", label: "Archive" },
  { id: "deleted", label: "Deleted Items" },
];

const MESSAGES: readonly { id: string; from: string; subject: string; preview: string; time: string }[] = [
  { id: "m1", from: "Priya Shah", subject: "Re: Weekly sync notes", preview: "Sounds good, see thread below for the...", time: "9:14 AM" },
  { id: "m2", from: "Facilities", subject: "Elevator maintenance Thu", preview: "The west elevator will be out of service...", time: "8:02 AM" },
  { id: "m3", from: "Dana Ortiz", subject: "Q3 planning doc", preview: "Attached the latest draft for review...", time: "Yesterday" },
];

function unitStyle(state: UnitState | undefined, token: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: token ? `var(${token})` : "var(--tile-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 3,
  };
  if (state === "wrong") {
    base.background = "#fbdcdc";
    base.textDecoration = "line-through";
    base.borderColor = "#c0392b";
  } else if (state === "correct") {
    base.fontWeight = 700;
    base.borderColor = "#2f7d4f";
    base.borderWidth = 2;
  } else if (state === "locked") {
    base.fontWeight = 700;
    base.borderStyle = "double";
    base.borderWidth = 3;
  } else if (state === "selected") {
    base.outline = "2px solid var(--brand)";
    base.outlineOffset = 1;
  }
  return base;
}

function FolderPane(): React.ReactElement {
  return (
    <nav
      aria-label="Folders"
      className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-[var(--border)] bg-[var(--panel)] px-2 py-3 text-sm md:flex"
    >
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Board at Work
      </p>
      <ul className="flex flex-col gap-0.5">
        {FOLDERS.map((folder) => (
          <li key={folder.id}>
            <span
              className={
                folder.id === "inbox"
                  ? "flex items-center justify-between rounded px-2 py-1.5 font-semibold text-[var(--brand)]"
                  : "flex items-center justify-between rounded px-2 py-1.5 text-[var(--text)]"
              }
              style={folder.id === "inbox" ? { background: "#e2ecfb" } : undefined}
            >
              {folder.label}
              {folder.count !== undefined && (
                <span className="text-xs text-neutral-500">{folder.count}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MessageListPane(): React.ReactElement {
  return (
    <aside
      aria-label="Messages"
      className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] lg:flex"
    >
      <ul className="flex flex-col divide-y divide-[var(--border)]">
        {MESSAGES.map((message, i) => (
          <li
            key={message.id}
            className="px-3 py-2.5 text-sm"
            style={i === 0 ? { background: "#eef3fb", borderLeft: "3px solid var(--brand)" } : undefined}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text)]">{message.from}</span>
              <span className="text-xs text-neutral-500">{message.time}</span>
            </div>
            <div className="truncate font-medium text-[var(--text)]">{message.subject}</div>
            <div className="truncate text-xs text-neutral-500">{message.preview}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--brand)] px-4 py-2 text-white">
        <h1 className="text-base font-semibold">
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
      </header>
      <div className="flex min-h-0 flex-1">
        <FolderPane />
        <MessageListPane />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--bg)] px-4 py-4 sm:px-8 sm:py-6">
          <div className="mx-auto flex max-w-[640px] flex-col gap-6">
            <div className="border-b border-[var(--border)] pb-3">
              <p className="text-lg font-semibold text-[var(--text)]">{title}</p>
              <p className="text-xs text-neutral-500">To: me@work.example</p>
            </div>
            {children}
          </div>
        </main>
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
          className="flex h-9 w-9 items-center justify-center text-base font-semibold uppercase disabled:cursor-default"
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
                className="flex h-8 w-8 items-center justify-center text-sm font-semibold uppercase disabled:cursor-default"
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
          className="flex h-9 w-9 items-center justify-center text-base font-semibold disabled:cursor-default"
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
                    className="flex h-9 w-9 items-center justify-center text-sm font-medium disabled:cursor-default"
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
    <div
      className="flex items-center gap-2 text-sm"
      aria-label={`${label}: ${String(used)} of ${String(total)} used`}
    >
      <span className="font-medium">{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full border border-[var(--border)]"
            style={{ background: i < used ? "var(--brand)" : "transparent" }}
          />
        ))}
      </span>
    </div>
  );
}

function Actions({ actions }: ActionsProps): React.ReactElement {
  return (
    <div
      className="flex flex-wrap gap-2 border-y border-[var(--border)] bg-[var(--panel)] px-3 py-2"
      role="toolbar"
      aria-label="Message actions"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.variant === "secondary"
              ? "rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm font-medium text-[var(--text)] disabled:opacity-40"
              : "rounded border border-[var(--brand)] bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
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
  const prefix = tone === "error" ? "Delivery failed: " : tone === "success" ? "Delivered: " : "";
  return (
    <p role="status" aria-live="polite" className="text-sm font-medium" style={{ color }}>
      {prefix}
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  return (
    <ul className="flex flex-col gap-2" aria-label="Replies in this thread">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded border border-[var(--border)] bg-[var(--panel)] p-2 pl-3 text-sm">
          <p className="text-xs font-semibold text-[var(--brand)]">{entry.author ?? "Reply"}</p>
          <p>{entry.text}</p>
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
        aria-labelledby="outlook-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded border border-[var(--border)] bg-[var(--bg)] shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3">
          <h2 id="outlook-modal-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-1 text-xl leading-none text-neutral-500 hover:text-[var(--text)]"
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
        className="w-full accent-[var(--brand)]"
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
                    className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border)] font-bold disabled:cursor-default"
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
    <div style={ROOT_STYLE} className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--brand)] px-4 py-2 text-white">
        <h1 className="text-base font-semibold">
          <button
            type="button"
            onClick={onExit}
            className="rounded underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Outlook
          </button>
        </h1>
      </header>
      <div className="flex min-h-0 flex-1">
        <FolderPane />
        <MessageListPane />
        <main className="flex min-w-0 flex-1 items-center justify-center bg-[var(--bg)] px-4 py-6">
          <p className="text-sm text-neutral-500">No message selected.</p>
        </main>
      </div>
    </div>
  );
}

export const outlookSkin: SkinPrimitives = {
  id: "outlook",
  displayName: "Outlook",
  favicon: "📧",
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
