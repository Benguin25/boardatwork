import type { ReactNode } from "react";

/**
 * Visual/interaction state a single addressable unit (a letter tile, a
 * grid cell, a passage word, ...) can be in. Color is never the only
 * signal (CLAUDE.md, SPEC §4.8): every skin must also vary weight,
 * underline, or an icon/label per state, not hue alone.
 */
export type UnitState = "default" | "selected" | "correct" | "wrong" | "locked";

export interface TextRunItem {
  id: string;
  text: string;
  /** Strand/group id this run belongs to, if any (e.g. a Braid strand). */
  groupId?: string;
  state?: UnitState;
  ariaLabel?: string;
}

export interface TextRunProps {
  items: readonly TextRunItem[];
  /** Maps a groupId to a skin token, e.g. `--accent-a`. */
  groupTokens?: Readonly<Record<string, string>>;
  onSelect?: (id: string) => void;
}

export interface TileRowProps {
  rows: readonly {
    id: string;
    label?: string;
    items: readonly TextRunItem[];
  }[];
  groupTokens?: Readonly<Record<string, string>>;
  onSelect?: (rowId: string, itemId: string) => void;
}

export interface SlotItem {
  id: string;
  value: string | null;
  placeholder?: string;
  state?: UnitState;
}

export interface SlotsProps {
  slots: readonly SlotItem[];
  onSelect?: (id: string) => void;
}

export interface GridCell {
  id: string;
  value: string;
  state?: UnitState;
}

export interface GridProps {
  rows: number;
  cols: number;
  /** Row-major, length === rows * cols. */
  cells: readonly GridCell[];
  rowTotals?: readonly (number | null)[];
  colTotals?: readonly (number | null)[];
  onSelect?: (id: string) => void;
}

export interface PassageWord {
  id: string;
  text: string;
  state?: UnitState;
}

export interface PassageProps {
  words: readonly PassageWord[];
  onSelect?: (id: string) => void;
}

export interface PassesProps {
  label: string;
  used: number;
  total: number;
}

export interface ActionItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export interface ActionsProps {
  actions: readonly ActionItem[];
}

export interface FeedbackProps {
  message: string;
  tone?: "neutral" | "success" | "error";
}

export interface LogEntry {
  id: string;
  author?: string;
  text: string;
}

export interface LogProps {
  entries: readonly LogEntry[];
}

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
}

export interface LogicGridCell {
  rowId: string;
  colId: string;
  state: "empty" | "yes" | "no";
}

export interface LogicGridProps {
  rowLabels: readonly { id: string; label: string }[];
  colLabels: readonly { id: string; label: string }[];
  cells: readonly LogicGridCell[];
  onSelect?: (rowId: string, colId: string) => void;
}

export interface ChromeProps {
  title: string;
  children: ReactNode;
  /** SPEC §3.1: clicking the document title flips to the cover state. */
  onTitleClick?: () => void;
}

/**
 * The only interface a `Game.render` may use (ADR-0003). A skin is a
 * complete, self-contained implementation of this shape plus a `Cover`
 * component for the panic-key fake-content state — nothing else about a
 * skin is visible to game code.
 */
export interface SkinPrimitives {
  id: string;
  displayName: string;
  /** One or two emoji used to build a data-URI favicon for this disguise. */
  favicon: string;
  Chrome: React.ComponentType<ChromeProps>;
  TextRun: React.ComponentType<TextRunProps>;
  TileRow: React.ComponentType<TileRowProps>;
  Slots: React.ComponentType<SlotsProps>;
  Grid: React.ComponentType<GridProps>;
  Passage: React.ComponentType<PassageProps>;
  Passes: React.ComponentType<PassesProps>;
  Actions: React.ComponentType<ActionsProps>;
  Feedback: React.ComponentType<FeedbackProps>;
  Log: React.ComponentType<LogProps>;
  Modal: React.ComponentType<ModalProps>;
  Slider: React.ComponentType<SliderProps>;
  LogicGrid: React.ComponentType<LogicGridProps>;
  /** Plain fake content shown when the user hits the panic control. */
  Cover: React.ComponentType<{ onExit: () => void }>;
}
