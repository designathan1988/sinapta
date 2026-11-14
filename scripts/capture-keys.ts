// The fingers of the hand: a step's typing, with its rhythm and slips,
// and its shortcut, key by key (plans from capture-typing.ts), each key
// noted for the overlay and watched as it goes.
import type { CaptureStep } from "./capture.schema.ts";
import { sleep, type Hand } from "./capture-hand.ts";
import { chordLabel, TYPED_MARK, typedLabel } from "./capture-trace.ts";
import { planChord, planTyping, type KeyEvent } from "./capture-typing.ts";
import { observe } from "./capture-watch.ts";

export async function playKeys(
  hand: Hand,
  events: readonly KeyEvent[],
): Promise<void> {
  const { keyboard } = hand.page;
  const start = performance.now();
  for (const event of events) {
    await sleep(event.t - (performance.now() - start));
    if (event.kind === "down") await keyboard.down(event.key);
    else if (event.kind === "up") await keyboard.up(event.key);
    else await keyboard.insertText(event.key);
    await observe(hand);
  }
}

export async function keys(hand: Hand, step: CaptureStep): Promise<void> {
  if (step.type !== undefined) {
    const typing = planTyping(step.type, hand);
    hand.trace.keys.push(TYPED_MARK + typedLabel(typing.events));
    await playKeys(hand, typing.events);
    const fixed =
      typing.typos > 0 ? `, ${String(typing.typos)} typo(s) fixed` : "";
    hand.notes.push(`typed ${String(step.type.length)} characters${fixed}`);
    await hand.snap?.("typed");
  }
  if (step.press !== undefined) {
    hand.trace.keys.push(chordLabel(step.press));
    await playKeys(hand, planChord(step.press, hand.random));
    hand.notes.push(`pressed ${step.press}`);
    await hand.snap?.("keys");
  }
}
