// A step's "watch": a page expression read again after every event the
// hand sends (each mouse report, press, release, key, wheel notch), with
// each change printed and timed from the start of the step. It shows
// what a photo at the end cannot: how fast feedback came after the
// action, whether it flickered, and what it did in between.
import type { Hand } from "./capture-hand.ts";

export interface Watch {
  readonly expression: string;
  readonly start: number;
  last: string | undefined;
  readonly changes: string[];
}

export function startWatch(hand: Hand, expression: string | undefined): void {
  hand.watch =
    expression === undefined
      ? undefined
      : { expression, start: performance.now(), last: undefined, changes: [] };
}

export async function observe(hand: Hand): Promise<void> {
  const { watch } = hand;
  if (watch === undefined) return;
  let value: string;
  try {
    const result: unknown = await hand.page.evaluate(watch.expression);
    value = result === undefined ? "undefined" : JSON.stringify(result);
  } catch (error) {
    value = `error: ${error instanceof Error ? (error.message.split("\n")[0] ?? "") : ""}`;
  }
  if (value === watch.last) return;
  watch.last = value;
  const ms = Math.round(performance.now() - watch.start);
  watch.changes.push(`${String(ms)} ms ${value}`);
}

// The changes, one line, oldest first; the watch stops.
export function endWatch(hand: Hand): string | undefined {
  const { watch } = hand;
  hand.watch = undefined;
  if (watch === undefined) return undefined;
  return `watched: ${watch.changes.join(" → ")}`;
}
