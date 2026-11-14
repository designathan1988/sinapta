// What the hand did since the last photo, kept to be drawn on the next
// one: every mouse report it sent (the trail), where it pressed and let
// go (clicks), and the keys and wheel turns, written as a person reads
// them on a keyboard ("Ctrl + Shift + ↓", "Secp⌫ond↵").
import type { KeyEvent } from "./capture-typing.ts";

export interface TracePoint {
  readonly x: number;
  readonly y: number;
  readonly t: number;
  readonly pressed: boolean;
}

export interface Mark {
  readonly x: number;
  readonly y: number;
  readonly kind: "down" | "up";
  readonly button: "left" | "right";
  readonly clicks: number;
}

export interface Trace {
  readonly moves: TracePoint[];
  readonly marks: Mark[];
  readonly keys: string[];
}

export function emptyTrace(): Trace {
  return { moves: [], marks: [], keys: [] };
}

// Starts the next step's trace from where the hand rests.
export function clearTrace(trace: Trace, at: { x: number; y: number }): void {
  trace.moves.length = 0;
  trace.marks.length = 0;
  trace.keys.length = 0;
  trace.moves.push({ x: at.x, y: at.y, t: performance.now(), pressed: false });
}

const KEY_NAMES: Record<string, string> = {
  Control: "Ctrl",
  Meta: "Win",
  ControlOrMeta: "Ctrl",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Enter: "Enter ↵",
  Backspace: "⌫",
  Escape: "Esc",
  Delete: "Del",
  Tab: "Tab ⇥",
  " ": "Space",
  PageUp: "PgUp",
  PageDown: "PgDn",
};

export function keyName(key: string): string {
  return KEY_NAMES[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}

// "Control+Shift+ArrowDown" as "Ctrl + Shift + ↓"; "Shift++" keeps its plus.
export function chordLabel(combo: string): string {
  const keys = combo.split("+");
  const named = keys.filter((key) => key !== "");
  const all = keys.length > named.length ? [...named, "+"] : named;
  return all.map(keyName).join(" + ");
}

const TYPED: Record<string, string> = {
  Enter: "↵",
  Backspace: "⌫",
  Tab: "⇥",
};

// Marks a typed entry among the keys, so it is drawn as text.
export const TYPED_MARK = "typed:";

// The characters as the fingers struck them, slips and Backspaces kept.
export function typedLabel(events: readonly KeyEvent[]): string {
  return events
    .filter((event) => event.kind !== "up" && event.key !== "Shift")
    .map((event) => TYPED[event.key] ?? event.key)
    .join("");
}

export function wheelLabel(
  delta: readonly [number, number],
  notches: number,
): string {
  const [dx, dy] = delta;
  const arrow =
    Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? "↓" : "↑") : dx > 0 ? "→" : "←";
  return `Wheel ${arrow} × ${String(notches)}`;
}
