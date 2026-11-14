// What the person feels and sees beside the photo, measured in the page
// after each step of a "human" plan: what is under the pointer and the
// cursor it shows (a headless photo has no cursor), where the focus is
// and whether its ring shows, the selected text, and what the live
// regions said. Only facts are printed; judging them is the reader's work.
import { shownCursor } from "./capture-cursor-state.ts";
import type { Hand } from "./capture-hand.ts";
import { clearTrace } from "./capture-trace.ts";
import { endWatch } from "./capture-watch.ts";

interface Felt {
  readonly under: string;
  readonly focus: string;
  readonly ring: string;
  readonly selection: string;
  readonly live: string;
}

function readFelt(at: { x: number; y: number }): Felt {
  const name = (element: Element | null): string => {
    if (element === null) return "nothing";
    const tag = element.tagName.toLowerCase();
    const kind = element.classList[0] ?? element.getAttribute("role") ?? "";
    const label =
      element.getAttribute("aria-label") ??
      element.textContent.trim().replace(/\s+/g, " ").slice(0, 32);
    return `${tag}${kind === "" ? "" : "." + kind}${label === "" ? "" : ` "${label}"`}`;
  };
  const under = document.elementFromPoint(at.x, at.y);
  const active = document.activeElement;
  const style = active === null ? null : getComputedStyle(active);
  const visible = active?.matches(":focus-visible") === true;
  const outline =
    style === null || style.outlineStyle === "none"
      ? "no outline"
      : `outline ${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`;
  const ring = `${visible ? ":focus-visible" : "not :focus-visible"}, ${outline}`;
  const regions = document.querySelectorAll(
    "[aria-live], [role=status], [role=alert]",
  );
  const live = [...regions]
    .map((region) => region.textContent.trim())
    .filter((text) => text !== "")
    .join(" | ");
  return {
    under: name(under),
    focus: active === document.body ? "body" : name(active),
    ring,
    selection: (getSelection()?.toString() ?? "").slice(0, 40),
    live: live.slice(0, 120),
  };
}

// What each hand last heard announced: printed again only when it changes.
const lastHeard = new WeakMap<Hand, string>();

export async function printFelt(hand: Hand, label: string): Promise<void> {
  const felt = await hand.page.evaluate(readFelt, hand.at);
  const shown = await shownCursor(hand);
  const why = shown.why === "" ? "" : ` (${shown.why})`;
  const at = `${String(Math.round(hand.at.x))},${String(Math.round(hand.at.y))}`;
  const watched = endWatch(hand);
  const lines = [
    ...hand.notes.map((done) => `  did: ${done}`),
    ...(watched === undefined ? [] : [`  ${watched}`]),
    `  pointer ${at}${hand.pressed ? " (button held)" : ""} on ${felt.under}, cursor ${shown.keyword}${why}`,
    `  focus ${felt.focus}, ${felt.ring}`,
  ];
  if (felt.selection !== "") lines.push(`  selected "${felt.selection}"`);
  if (felt.live !== "" && felt.live !== lastHeard.get(hand)) {
    lines.push(`  announced "${felt.live}"`);
  }
  lastHeard.set(hand, felt.live);
  console.log([label, ...lines].filter((line) => line !== "").join("\n"));
  hand.notes.length = 0;
  clearTrace(hand.trace, hand.at);
}
