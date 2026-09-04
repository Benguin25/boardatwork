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
 * Terminal skin (SPEC §3.1): a dark command-line disguise — monospace
 * throughout, puzzle content rendered as `cat`/REPL stdout, actions styled
 * as typed `$ ` commands, feedback and history appended as further output
 * lines below a shell prompt. Addressable units read like a boxed ASCII
 * table cell; state is always carried by weight/border-style/underline as
 * well as colour so nothing here depends on colour alone.
 */
const ROOT_STYLE: React.CSSProperties = {
  ["--tile-bg" as string]: "#11161d",
  ["--accent-a" as string]: "#e3b341",
  ["--accent-b" as string]: "#56d364",
  ["--accent-c" as string]: "#79c0ff",
  ["--danger" as string]: "#ff7b72",
  ["--text" as string]: "#e6edf3",
  ["--muted" as string]: "#8b949e",
  ["--bg" as string]: "#0a0e14",
  ["--border" as string]: "#30363d",
  fontFamily:
    'ui-monospace, "Cascadia Code", "Fira Code", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
};

/** Boxed-unit styling (letters, grid cells, slots, tile rows). */
function unitStyle(state: UnitState | undefined, token: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: "var(--tile-bg)",
    color: "var(--text)",
    border: `1px solid ${token ? `var(${token})` : "var(--border)"}`,
    fontWeight: 400,
  };
  if (state === "wrong") {
    base.color = "var(--danger)";
    base.textDecoration = "line-through";
    base.borderColor = "var(--danger)";
  } else if (state === "correct") {
    base.color = "var(--accent-b)";
    base.fontWeight = 700;
    base.borderColor = "var(--accent-b)";
  } else if (state === "locked") {
    base.fontWeight = 700;
    base.borderStyle = "double";
    base.borderWidth = "3px";
  } else if (state === "selected") {
    base.background = "var(--text)";
    base.color = "var(--bg)";
    base.fontWeight = 700;
  }
  return base;
}

/** Inline-text styling for running prose (Passage): no boxes, underlines instead. */
function passageStyle(state: UnitState | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    background: "transparent",
    color: "var(--text)",
    borderBottom: "1px solid transparent",
    fontWeight: 400,
  };
  if (state === "wrong") {
    base.color = "var(--danger)";
    base.textDecoration = "line-through";
  } else if (state === "correct") {
    base.color = "var(--accent-b)";
    base.fontWeight = 700;
    base.borderBottom = "1px solid var(--accent-b)";
  } else if (state === "locked") {
    base.fontWeight = 700;
    base.borderBottom = "1px dashed var(--muted)";
  } else if (state === "selected") {
    base.background = "var(--tile-bg)";
    base.fontWeight = 700;
    base.borderBottom = "1px solid var(--accent-c)";
  }
  return base;
}

function WindowDots(): React.ReactElement {
  return (
    <span aria-hidden="true" className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)]" style={{ background: "var(--danger)" }} />
      <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)]" style={{ background: "var(--accent-a)" }} />
      <span className="h-2.5 w-2.5 rounded-full border border-[var(--border)]" style={{ background: "var(--accent-b)" }} />
    </span>
  );
}

function Chrome({ title, children, onTitleClick }: ChromeProps): React.ReactElement {
  return (
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] font-mono text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--tile-bg)]">
        <div className="mx-auto flex max-w-[720px] items-center gap-2 px-4 py-2">
          <WindowDots />
          <span className="ml-1 text-xs" style={{ color: "var(--muted)" }}>
            bash — 80x24
          </span>
        </div>
        <div className="mx-auto max-w-[720px] px-4 pb-3">
          <h1 className="text-base font-semibold tracking-tight">
            <span aria-hidden="true" style={{ color: "var(--accent-b)" }}>
              visitor@boardwork
            </span>
            <span aria-hidden="true" style={{ color: "var(--muted)" }}>
              :~${" "}
            </span>
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className="rounded-sm underline-offset-4 hover:underline focus-visible:underline"
              >
                {title}
              </button>
            ) : (
              <span>{title}</span>
            )}
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-[720px] px-4 py-6">{children}</main>
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
          className="flex h-10 w-10 items-center justify-center rounded-sm text-lg font-semibold uppercase disabled:cursor-default"
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
            <span className="w-24 shrink-0 text-sm" style={{ color: "var(--muted)" }}>
              {row.label}
            </span>
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
                className="flex h-9 w-9 items-center justify-center rounded-sm text-base font-semibold uppercase disabled:cursor-default"
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
          className="flex h-10 w-10 items-center justify-center rounded-sm text-lg font-semibold disabled:cursor-default"
        >
          {slot.value ?? <span style={{ color: "var(--muted)" }}>{slot.placeholder ?? "_"}</span>}
        </button>
      ))}
    </div>
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
              if (!cell) return <td key={c} />;
              return (
                <td key={cell.id} className="p-0.5">
                  <button
                    type="button"
                    onClick={() => onSelect?.(cell.id)}
                    disabled={!onSelect}
                    aria-label={`Row ${String(r + 1)}, column ${String(c + 1)}: ${cell.value}`}
                    style={unitStyle(cell.state, undefined)}
                    className="flex h-10 w-10 items-center justify-center rounded-sm font-medium disabled:cursor-default"
                  >
                    {cell.value}
                  </button>
                </td>
              );
            })}
            {rowTotals && (
              <td
                className="pl-2 text-sm font-semibold"
                style={{ color: "var(--muted)" }}
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
                className="pt-1 text-sm font-semibold"
                style={{ color: "var(--muted)" }}
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
    <p className="text-base leading-relaxed">
      {words.map((word, i) => (
        <span key={word.id}>
          <button
            type="button"
            onClick={() => onSelect?.(word.id)}
            disabled={!onSelect}
            style={passageStyle(word.state)}
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
  const readout = Array.from({ length: total }, (_, i) => (i < used ? "#" : ".")).join("");
  return (
    <div
      className="flex items-center gap-2 text-sm"
      aria-label={`${label}: ${String(used)} of ${String(total)} used`}
    >
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span aria-hidden="true" className="tracking-tight" style={{ color: "var(--accent-c)" }}>
        [{readout}]
      </span>
      <span aria-hidden="true" className="text-xs" style={{ color: "var(--muted)" }}>
        {used}/{total}
      </span>
    </div>
  );
}

function Actions({ actions }: ActionsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Commands">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.variant === "secondary"
              ? "rounded-sm border border-[var(--border)] bg-[var(--tile-bg)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:border-[var(--accent-c)] disabled:opacity-40"
              : "rounded-sm border border-[var(--accent-b)] bg-[var(--tile-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--accent-b)] hover:bg-[var(--border)] disabled:opacity-40"
          }
        >
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>
            ${" "}
          </span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

function Feedback({ message, tone }: FeedbackProps): React.ReactElement {
  const color = tone === "error" ? "var(--danger)" : tone === "success" ? "var(--accent-b)" : "var(--text)";
  const glyph = tone === "error" ? "✗" : tone === "success" ? "✓" : ">";
  return (
    <p role="status" aria-live="polite" className="text-sm font-medium" style={{ color }}>
      <span aria-hidden="true">{glyph} </span>
      {message}
    </p>
  );
}

function Log({ entries }: LogProps): React.ReactElement {
  return (
    <ul className="flex flex-col gap-1 text-sm" aria-label="Log">
      {entries.map((entry) => (
        <li key={entry.id}>
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>
            {"> "}
          </span>
          {entry.author !== undefined && (
            <strong className="font-semibold" style={{ color: "var(--accent-c)" }}>
              [{entry.author}]{" "}
            </strong>
          )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminal-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-sm border border-[var(--accent-c)] bg-[var(--tile-bg)] p-6 text-[var(--text)]"
      >
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-2">
          <h2 id="terminal-modal-title" className="text-base font-semibold">
            <span aria-hidden="true" style={{ color: "var(--muted)" }}>
              $ man{" "}
            </span>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm border border-[var(--border)] px-2 py-0.5 text-sm leading-none hover:border-[var(--danger)]"
          >
            [x]
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
        <span aria-hidden="true" style={{ color: "var(--muted)" }}>
          $ set{" "}
        </span>
        {label}={value}
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
        className="w-full accent-[var(--accent-b)]"
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
            <th
              key={col.id}
              className="border border-[var(--border)] px-2 pb-1 font-medium"
              style={{ color: "var(--muted)" }}
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
              className="border border-[var(--border)] pr-2 text-right font-medium"
              style={{ color: "var(--muted)" }}
            >
              {row.label}
            </th>
            {colLabels.map((col) => {
              const cell = cellFor(row.id, col.id);
              const glyph = cell?.state === "yes" ? "y" : cell?.state === "no" ? "n" : "·";
              const color =
                cell?.state === "yes"
                  ? "var(--accent-b)"
                  : cell?.state === "no"
                    ? "var(--danger)"
                    : "var(--muted)";
              return (
                <td key={col.id} className="border border-[var(--border)] p-0.5">
                  <button
                    type="button"
                    onClick={() => onSelect?.(row.id, col.id)}
                    disabled={!onSelect}
                    aria-label={`${row.label}, ${col.label}: ${cell?.state ?? "empty"}`}
                    style={{ color }}
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
    <div style={ROOT_STYLE} className="min-h-screen bg-[var(--bg)] font-mono text-[var(--text)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--tile-bg)] px-4 py-2">
        <WindowDots />
        <h1 className="ml-1 text-xs font-normal">
          <button
            type="button"
            onClick={onExit}
            className="rounded-sm hover:underline focus-visible:underline"
            style={{ color: "var(--muted)" }}
          >
            Board at Work — bash
          </button>
        </h1>
      </div>
      <main className="mx-auto max-w-[720px] px-4 py-6 text-sm">
        <p>
          <span style={{ color: "var(--accent-b)" }}>guest@localhost</span>
          <span style={{ color: "var(--muted)" }}>:~$ </span>
          <span aria-hidden="true" className="motion-safe:animate-pulse">
            _
          </span>
        </p>
      </main>
    </div>
  );
}

export const terminalSkin: SkinPrimitives = {
  id: "terminal",
  displayName: "Terminal",
  favicon: "💻",
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
