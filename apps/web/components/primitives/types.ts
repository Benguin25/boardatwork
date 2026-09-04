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
  /** Accessible name for the group of units, e.g. "Braided letters". */
  ariaLabel: string;
  /**
   * Maps a groupId to a skin token, e.g. `--accent-a`. Every skin also
   * defines a darker `${token}-lock` companion, used for locked units.
   */
  groupTokens?: Readonly<Record<string, string>>;
  onSelect?: (id: string) => void;
}

/**
 * The lead line(s) above a puzzle: the Braid theme, the Proof instruction,
 * the Forecast question. `pending` renders the headline as the skin's
 * "not yet revealed" treatment (muted italic in Play) rather than as a
 * statement of fact.
 */
export interface PromptProps {
  headline: string;
  tone?: "revealed" | "pending";
  /** Muted secondary line: "6 and 6 letters", "3 of 5 flagged". */
  note?: string;
}

export interface SlotItem {
  id: string;
  value: string | null;
  state?: UnitState;
}

export interface SlotRow {
  id: string;
  /**
   * Screen-reader name for the row. Never rendered as visible text — the
   * Play skin's strands carry no "Strand 1" labels — so this is how
   * SPEC §4.8's "colour is never the only signal" is met for grouped rows.
   */
  ariaLabel: string;
  /** Group token key, so the row's slots take the group's colour. */
  groupId?: string;
  slots: readonly SlotItem[];
  /** Muted trailing count, e.g. "3 / 6". */
  note?: string;
}

/** Read-only by design: slots mirror assignments made elsewhere (a `TextRun`). */
export interface SlotsProps {
  rows: readonly SlotRow[];
  groupTokens?: Readonly<Record<string, string>>;
}

export interface GridCell {
  id: string;
  value: string;
  state?: UnitState;
}

/** A row/column total shown beside a `Grid`; `reconciled: false` reads as an error. */
export interface GridTotal {
  value: number;
  reconciled: boolean;
}

export interface GridProps {
  rows: number;
  cols: number;
  /** Row-major, length === rows * cols. */
  cells: readonly GridCell[];
  ariaLabel: string;
  rowTotals?: readonly GridTotal[];
  colTotals?: readonly GridTotal[];
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
  /** Renders a ✓/✗ verdict marker beside the entry (Policy's probe log). */
  status?: "yes" | "no";
}

export interface LogProps {
  entries: readonly LogEntry[];
  ariaLabel: string;
}

/** A resolved-facts list: Org's assignments, or any label → value readout. */
export interface SummaryProps {
  items: readonly { id: string; label: string; value: string }[];
  ariaLabel: string;
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

/** A typed numeric answer, paired with `Slider` in Forecast. */
export interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
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
  ariaLabel: string;
  onSelect?: (rowId: string, colId: string) => void;
}

/** One entry in a skin's header nav / app menu. */
export interface ChromeNavItem {
  id: string;
  label: string;
  onClick: () => void;
}

export interface ChromeProps {
  /** Game name: the Play wordmark, the Work document/board title. */
  title: string;
  /** Small muted qualifier beside the wordmark, e.g. "#412" or "practice". */
  subtitle?: string;
  /** Date/context line above the puzzle. */
  meta?: string;
  /**
   * Shell-level aside shown above the puzzle — currently the "who
   * challenged you" line (SPEC §3.3). Skins place it in their own idiom.
   */
  notice?: string;
  /** How to play · Stats · Make one, placed per the skin's own idiom. */
  nav: readonly ChromeNavItem[];
  /** SPEC §3.1: clicking the document title flips to the cover state. */
  onTitleClick?: () => void;
  /** Opens the disguise picker (SPEC §3.1 "Work mode settings"). */
  onChangeDisguise: () => void;
  /** Leaves Work mode. Absent in the Play skin, which is already there. */
  onExitMode?: () => void;
  children: ReactNode;
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
  /** The app's mark, drawn in the chrome and in the disguise picker. */
  Icon: React.ComponentType<{ className?: string }>;
  /** Data-URI favicon for this disguise (SPEC §3.1). */
  faviconHref: string;
  /** `document.title` while this skin is showing (SPEC §3.1). */
  tabTitle: string;
  Chrome: React.ComponentType<ChromeProps>;
  Prompt: React.ComponentType<PromptProps>;
  TextRun: React.ComponentType<TextRunProps>;
  Slots: React.ComponentType<SlotsProps>;
  Grid: React.ComponentType<GridProps>;
  Passage: React.ComponentType<PassageProps>;
  Passes: React.ComponentType<PassesProps>;
  Actions: React.ComponentType<ActionsProps>;
  Feedback: React.ComponentType<FeedbackProps>;
  Log: React.ComponentType<LogProps>;
  Summary: React.ComponentType<SummaryProps>;
  Modal: React.ComponentType<ModalProps>;
  Slider: React.ComponentType<SliderProps>;
  NumberField: React.ComponentType<NumberFieldProps>;
  LogicGrid: React.ComponentType<LogicGridProps>;
  /** Plain fake content shown when the user hits the panic control. */
  Cover: React.ComponentType<{ onExit: () => void }>;
}
