// How a person types, as a timed list of key events: no page, no clock.
// Keys go down and up (held 60 to 130 ms), the gap between presses comes
// from the typing speed and varies by about a third, word starts and
// punctuation are slower, a thought now and then pauses the hands, Shift
// goes down before a capital and up after it, the next key may go down
// before the last comes up (rollover), and with "typos" a neighbouring key
// is hit, noticed a key or two later and taken back with Backspace.
import { between, gaussian, type Random } from "./capture-motion.ts";

export interface KeyEvent {
  readonly kind: "down" | "up" | "text";
  readonly key: string;
  readonly t: number;
}

export interface Typist {
  readonly random: Random;
  // Words per minute, five characters a word.
  readonly wpm: number;
  // The chance that a letter is mistyped.
  readonly typos: number;
}

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const SHIFTED = '~!@#$%^&*()_+{}|:"<>?';
const PLAIN = "`1234567890-=[]\\;',./ ";
const NAMED: Record<string, string> = {
  "\n": "Enter",
  "\t": "Tab",
  "\b": "Backspace",
};

// A key next to this letter on a QWERTY keyboard.
function neighbour(letter: string, random: Random): string {
  const lower = letter.toLowerCase();
  const row = ROWS.findIndex((keys) => keys.includes(lower));
  const keys = ROWS[row] ?? "";
  const at = keys.indexOf(lower);
  const near = [keys[at - 1], keys[at + 1]].filter((k) => k !== undefined);
  const pick = near[Math.floor(random() * near.length)] ?? lower;
  return letter === lower ? pick : pick.toUpperCase();
}

function keyOf(char: string): string | undefined {
  if (NAMED[char] !== undefined) return NAMED[char];
  if (
    /^[A-Za-z]$/.test(char) ||
    SHIFTED.includes(char) ||
    PLAIN.includes(char)
  ) {
    return char;
  }
  return undefined;
}

function needsShift(char: string): boolean {
  return /^[A-Z]$/.test(char) || SHIFTED.includes(char);
}

// The gap before this character, from the speed and what is around it.
function gapBefore(
  text: readonly string[],
  index: number,
  typist: Typist,
): number {
  const mean = 60000 / (typist.wpm * 5);
  const before = text[index - 1] ?? " ";
  const char = text[index] ?? "";
  let gap = mean * Math.exp(0.32 * gaussian(typist.random));
  if (before === " ") gap *= 1.2;
  if (/[^\w\s]/.test(char) || /[^\w\s]/.test(before)) gap *= 1.35;
  if (char === before) gap *= 0.8;
  if (typist.random() < 0.03) gap += between(typist.random, 400, 1200);
  return Math.max(35, gap);
}

interface Pen {
  readonly typist: Typist;
  readonly events: KeyEvent[];
  t: number;
  // When the last key went down, and when Shift last came up: a plain
  // key never goes down under Shift, nor Shift under the key before.
  lastDown: number;
  shiftUp: number;
}

function strikePlain(pen: Pen, key: string, hold: number): void {
  const down = Math.max(pen.t, pen.shiftUp + 3);
  pen.events.push(
    { kind: "down", key, t: down },
    { kind: "up", key, t: down + hold },
  );
  pen.t = down;
  pen.lastDown = down;
}

function strikeShifted(pen: Pen, key: string, hold: number): void {
  const { random } = pen.typist;
  const shiftDown = Math.max(pen.t - between(random, 40, 90), pen.lastDown + 5);
  const down = Math.max(pen.t, shiftDown + 20);
  const shiftUp = down + hold + between(random, 10, 60);
  pen.events.push(
    { kind: "down", key: "Shift", t: shiftDown },
    { kind: "down", key, t: down },
    { kind: "up", key, t: down + hold },
    { kind: "up", key: "Shift", t: shiftUp },
  );
  pen.t = down;
  pen.lastDown = down;
  pen.shiftUp = shiftUp;
}

function strike(pen: Pen, char: string): void {
  const key = keyOf(char);
  const hold = Math.max(45, 95 + 18 * gaussian(pen.typist.random));
  if (key === undefined) {
    pen.t = Math.max(pen.t, pen.shiftUp + 3);
    pen.events.push({ kind: "text", key: char, t: pen.t });
  } else if (needsShift(char)) {
    strikeShifted(pen, key, hold);
  } else {
    strikePlain(pen, key, hold);
  }
}

// A slip: the wrong key, one or two more keys of the word, a pause to
// notice, Backspace for each, then the word goes on as meant.
function slip(pen: Pen, text: readonly string[], index: number): void {
  const { typist } = pen;
  const { random } = typist;
  const more = text.slice(index + 1, index + 1 + Math.floor(random() * 3));
  const extra = more.includes(" ") ? [] : more;
  strike(pen, neighbour(text[index] ?? "", random));
  for (const char of extra) {
    pen.t += gapBefore(text, index + 1, typist);
    strike(pen, char);
  }
  pen.t += between(random, 250, 700);
  for (let n = 0; n <= extra.length; n += 1) {
    strike(pen, "\b");
    pen.t += between(random, 110, 170);
  }
}

export interface Typing {
  readonly events: KeyEvent[];
  readonly typos: number;
}

// What a person types one at a time: a letter, an accented letter, an
// emoji with its skin tone or a flag, never half of one.
function graphemes(text: string): string[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...segmenter.segment(text)].map((part) => part.segment);
}

export function planTyping(typed: string, typist: Typist): Typing {
  const text = graphemes(typed);
  const pen: Pen = { typist, events: [], t: 0, lastDown: -1, shiftUp: -1 };
  let typos = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (index > 0) pen.t += gapBefore(text, index, typist);
    const char = text[index] ?? "";
    if (/^[a-z]$/i.test(char) && typist.random() < typist.typos) {
      slip(pen, text, index);
      typos += 1;
    }
    strike(pen, char);
  }
  const events = [...pen.events].sort((a, b) => a.t - b.t);
  return { events, typos };
}

// The keys of a shortcut, as Playwright names them: "Control+Shift+K",
// "Shift++" for the plus key.
function chordKeys(combo: string): string[] {
  const keys = combo.split("+");
  const named = keys.filter((key) => key !== "");
  return keys.length > named.length ? [...named, "+"] : named;
}

// A shortcut as fingers press it: the modifiers one after another, the
// key, then everything let go, the modifiers in an order of their own.
export function planChord(combo: string, random: Random): KeyEvent[] {
  const keys = chordKeys(combo);
  const key = keys[keys.length - 1] ?? combo;
  const modifiers = keys.slice(0, -1);
  const events: KeyEvent[] = [];
  let t = 0;
  for (const modifier of modifiers) {
    events.push({ kind: "down", key: modifier, t });
    t += between(random, 25, 70);
  }
  if (modifiers.length > 0) t += between(random, 15, 50);
  events.push({ kind: "down", key, t });
  t += Math.max(50, 100 + 20 * gaussian(random));
  events.push({ kind: "up", key, t });
  const order = random() < 0.3 ? modifiers : [...modifiers].reverse();
  for (const modifier of order) {
    t += between(random, 10, 60);
    events.push({ kind: "up", key: modifier, t });
  }
  return events;
}
